// src/services/adafruit.service.js
const axios = require('axios');
const logger = require('../utils/logger');

class AdafruitService {
  constructor() {
    this.username = process.env.ADAFRUIT_IO_USERNAME;
    this.key = process.env.ADAFRUIT_IO_KEY;
    this.baseURL = 'https://io.adafruit.com/api/v2';
    
    // Map standard feed names to actual Adafruit feed keys
    this.feedMapping = {
      'temperature': process.env.ADAFRUIT_TEMP_FEED || 'dht-temp',
      'humidity': process.env.ADAFRUIT_HUMIDITY_FEED || 'dht-hum',
      'soil-moisture': process.env.ADAFRUIT_SOIL_FEED || 'soil-moisture'
    };
    
    logger.info('AdafruitService initialized with config:', {
      username: this.username,
      baseURL: this.baseURL,
      feedMapping: this.feedMapping
    });
    
    if (!this.username || !this.key) {
      logger.warn('Adafruit IO credentials not configured. Sensor data fetching will not work.');
    }
  }

  /**
   * Fetch latest data from a specific feed
   * @param {string} feedKey - The feed key (e.g., 'temperature', 'humidity', 'soil-moisture')
   * @returns {Promise<Object>} Feed data
   */
  async getFeedData(feedKey) {
    try {
      if (!this.username || !this.key) {
        throw new Error('Adafruit IO credentials not configured');
      }

      // Use the mapped feed key if it exists
      const actualFeedKey = this.feedMapping[feedKey] || feedKey;
      const url = `${this.baseURL}/${this.username}/feeds/${actualFeedKey}/data/last`;
      
      logger.info(`Fetching data from Adafruit feed: ${actualFeedKey} (requested: ${feedKey})`);
      
      const response = await axios.get(url, {
        headers: {
          'X-AIO-Key': this.key
        },
        timeout: 15000 // Increased timeout to 15 seconds
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching feed ${feedKey} from Adafruit IO:`, error.message);
      // Provide more detailed error information
      if (error.response) {
        logger.error(`Adafruit API response for ${feedKey}:`, {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // If it's a 404 error, it might mean the feed doesn't exist yet
        if (error.response.status === 404) {
          logger.warn(`Feed ${feedKey} not found. This might be expected if no data has been sent yet.`);
          return null; // Return null instead of throwing error
        }
      }
      throw new Error(`Failed to fetch data from Adafruit IO feed "${feedKey}": ${error.message}`);
    }
  }

  /**
   * Fetch multiple feed values at once
   * @param {Array<string>} feedKeys - Array of feed keys
   * @returns {Promise<Object>} Object with feed data
   */
  async getMultipleFeedData(feedKeys) {
    try {
      const promises = feedKeys.map(feedKey => 
        this.getFeedData(feedKey).catch(err => {
          logger.error(`Failed to fetch ${feedKey}:`, err.message);
          return null;
        })
      );

      const results = await Promise.all(promises);
      
      const data = {};
      feedKeys.forEach((key, index) => {
        data[key] = results[index];
      });

      return data;
    } catch (error) {
      logger.error('Error fetching multiple feeds from Adafruit IO:', error.message);
      throw new Error(`Failed to fetch multiple feeds from Adafruit IO: ${error.message}`);
    }
  }

  /**
   * Fetch all sensor data (temperature, humidity, soil moisture)
   * @returns {Promise<Object>} Combined sensor data
   */
  async getAllSensorData() {
    try {
      logger.info('Starting getAllSensorData function');
      const feeds = ['temperature', 'humidity', 'soil-moisture'];
      logger.info('Fetching data for feeds:', feeds);
      const data = await this.getMultipleFeedData(feeds);
      logger.info('Received data from getMultipleFeedData:', data);

      // Instead of throwing error for missing feeds, we'll use default values
      const sensorData = {
        temperature: data.temperature ? parseFloat(data.temperature.value) : null,
        humidity: data.humidity ? parseFloat(data.humidity.value) : null,
        soilMoisture: data['soil-moisture'] ? parseFloat(data['soil-moisture'].value) : null,
        timestamp: new Date()
      };

      logger.info('Parsed sensor data:', sensorData);

      // Use the most recent timestamp if available
      const timestamps = [
        data.temperature?.created_at,
        data.humidity?.created_at,
        data['soil-moisture']?.created_at
      ].filter(Boolean);

      if (timestamps.length > 0) {
        const mostRecent = timestamps.reduce((latest, current) => {
          const currentDate = new Date(current);
          return currentDate > new Date(latest) ? current : latest;
        });
        sensorData.timestamp = new Date(mostRecent);
      }

      logger.info('Successfully fetched sensor data from Adafruit IO:', {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        soilMoisture: sensorData.soilMoisture,
        timestamp: sensorData.timestamp
      });

      return sensorData;
    } catch (error) {
      logger.error('Error fetching all sensor data:', {
        message: error.message,
        stack: error.stack
      });
      throw new Error(`Failed to fetch sensor data from Adafruit IO: ${error.message}`);
    }
  }

  /**
   * Fetch historical data from a feed
   * @param {string} feedKey - The feed key
   * @param {number} limit - Number of data points to fetch (max 1000)
   * @returns {Promise<Array>} Array of data points
   */
  async getFeedHistory(feedKey, limit = 100) {
    try {
      if (!this.username || !this.key) {
        throw new Error('Adafruit IO credentials not configured');
      }

      // Use the mapped feed key if it exists
      const actualFeedKey = this.feedMapping[feedKey] || feedKey;
      const url = `${this.baseURL}/${this.username}/feeds/${actualFeedKey}/data`;
      
      const response = await axios.get(url, {
        headers: {
          'X-AIO-Key': this.key
        },
        params: {
          limit: Math.min(limit, 1000) // Adafruit IO max is 1000
        },
        timeout: 15000 // 15 second timeout for historical data
      });

      return response.data;
    } catch (error) {
      logger.error(`Error fetching history for ${feedKey} from Adafruit IO:`, error.message);
      throw new Error(`Failed to fetch historical data from Adafruit IO feed "${feedKey}": ${error.message}`);
    }
  }

  /**
   * List all available feeds for the user
   * @returns {Promise<Array>} Array of feed objects
   */
  async listFeeds() {
    try {
      if (!this.username || !this.key) {
        throw new Error('Adafruit IO credentials not configured');
      }

      const url = `${this.baseURL}/${this.username}/feeds`;
      const response = await axios.get(url, {
        headers: {
          'X-AIO-Key': this.key
        },
        timeout: 10000 // 10 second timeout
      });

      return response.data;
    } catch (error) {
      logger.error('Error listing feeds from Adafruit IO:', error.message);
      throw new Error(`Failed to list feeds from Adafruit IO: ${error.message}`);
    }
  }

  /**
   * Check if required feeds exist
   * @returns {Promise<Object>} Feed existence status
   */
  async checkRequiredFeeds() {
    try {
      const feeds = await this.listFeeds();
      const requiredFeeds = ['temperature', 'humidity', 'soil-moisture'];
      
      const feedStatus = {};
      requiredFeeds.forEach(feed => {
        const actualFeedKey = this.feedMapping[feed];
        const exists = feeds.some(f => f.key === actualFeedKey);
        feedStatus[feed] = {
          exists,
          actualKey: actualFeedKey,
          details: exists ? feeds.find(f => f.key === actualFeedKey) : null
        };
      });
      
      return feedStatus;
    } catch (error) {
      logger.error('Error checking required feeds:', error.message);
      throw new Error(`Failed to check required feeds: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = new AdafruitService();