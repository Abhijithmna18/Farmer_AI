// src/services/mqtt-adafruit.service.js
const mqtt = require('mqtt');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');
const { getIO } = require('./realtime.service');

class MQTTAdafruitService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 5000; // 5 seconds
    this.username = process.env.ADAFRUIT_IO_USERNAME;
    this.key = process.env.ADAFRUIT_IO_KEY;
    
    // Map standard feed names to actual Adafruit feed keys
    this.feedMapping = {
      'temperature': process.env.ADAFRUIT_TEMP_FEED || 'dht-temp',
      'humidity': process.env.ADAFRUIT_HUMIDITY_FEED || 'dht-hum',
      'soil-moisture': process.env.ADAFRUIT_SOIL_FEED || 'soil-moisture'
    };
    
    // Cache for latest sensor data
    this.latestData = {
      temperature: null,
      humidity: null,
      soilMoisture: null,
      timestamp: null
    };
    
    logger.info('MQTTAdafruitService initialized with config:', {
      username: this.username,
      feedMapping: this.feedMapping
    });
    
    if (!this.username || !this.key) {
      logger.warn('Adafruit IO credentials not configured. MQTT connection will not work.');
    }
  }

  /**
   * Connect to Adafruit IO MQTT broker
   */
  connect() {
    if (!this.username || !this.key) {
      logger.error('Adafruit IO credentials not configured. Cannot connect to MQTT.');
      return;
    }
    
    if (this.isConnected) {
      logger.info('Already connected to Adafruit IO MQTT broker');
      return;
    }
    
    const options = {
      username: this.username,
      password: this.key,
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 30 * 1000, // 30 seconds
      will: {
        topic: `${this.username}/status`,
        payload: 'offline',
        qos: 0,
        retain: false
      }
    };
    
    const brokerUrl = 'mqtt://io.adafruit.com';
    
    logger.info('Connecting to Adafruit IO MQTT broker:', brokerUrl);
    
    try {
      this.client = mqtt.connect(brokerUrl, options);
      
      this.client.on('connect', () => {
        logger.info('Connected to Adafruit IO MQTT broker');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Subscribe to all sensor feeds
        Object.entries(this.feedMapping).forEach(([key, feedName]) => {
          const topic = `${this.username}/feeds/${feedName}`;
          this.client.subscribe(topic, (err) => {
            if (err) {
              logger.error(`Failed to subscribe to topic ${topic}:`, err.message);
            } else {
              logger.info(`Subscribed to topic: ${topic}`);
            }
          });
        });
        
        // Publish status
        this.client.publish(`${this.username}/status`, 'online', { qos: 0, retain: false });
      });
      
      this.client.on('message', (topic, message) => {
        this.handleMessage(topic, message.toString());
      });
      
      this.client.on('error', (error) => {
        logger.error('MQTT connection error:', error.message);
        this.isConnected = false;
        this.handleReconnect();
      });
      
      this.client.on('close', () => {
        logger.info('MQTT connection closed');
        this.isConnected = false;
        this.handleReconnect();
      });
      
      this.client.on('reconnect', () => {
        logger.info('MQTT reconnecting...');
      });
      
      this.client.on('offline', () => {
        logger.warn('MQTT client is offline');
        this.isConnected = false;
      });
    } catch (error) {
      logger.error('Failed to create MQTT client:', error.message);
      this.handleReconnect();
    }
  }

  /**
   * Handle incoming MQTT messages
   */
  handleMessage(topic, message) {
    try {
      logger.info(`Received message on topic ${topic}:`, message);
      
      // Extract feed name from topic
      const feedName = topic.split('/').pop();
      
      // Find which sensor this feed corresponds to
      let sensorType = null;
      for (const [type, name] of Object.entries(this.feedMapping)) {
        if (name === feedName) {
          sensorType = type;
          break;
        }
      }
      
      if (!sensorType) {
        logger.warn(`Unknown feed: ${feedName}`);
        return;
      }
      
      // Parse the message
      const value = parseFloat(message);
      if (isNaN(value)) {
        logger.warn(`Invalid value received for ${sensorType}:`, message);
        return;
      }
      
      // Update latest data cache
      this.latestData[sensorType] = value;
      this.latestData.timestamp = new Date();
      
      // Check if we have data from all sensors
      if (this.latestData.temperature !== null && 
          this.latestData.humidity !== null && 
          this.latestData.soilMoisture !== null) {
        this.saveSensorData();
      }
    } catch (error) {
      logger.error('Error handling MQTT message:', error.message);
    }
  }

  /**
   * Save sensor data to database
   */
  async saveSensorData() {
    try {
      // Validate data ranges
      if (this.latestData.temperature < -50 || this.latestData.temperature > 100) {
        logger.warn('Temperature value out of valid range:', this.latestData.temperature);
        return;
      }

      if (this.latestData.humidity < 0 || this.latestData.humidity > 100) {
        logger.warn('Humidity value out of valid range:', this.latestData.humidity);
        return;
      }

      if (this.latestData.soilMoisture < 0 || this.latestData.soilMoisture > 4095) {
        logger.warn('Soil moisture value out of valid range:', this.latestData.soilMoisture);
        return;
      }
      
      // Check if data with this timestamp already exists (prevent duplicates)
      const existingData = await SensorData.findOne({
        timestamp: this.latestData.timestamp
      });

      if (existingData) {
        logger.info('Sensor data with this timestamp already exists, skipping...');
        return;
      }

      // Save to database
      const newSensorData = new SensorData({
        temperature: parseFloat(this.latestData.temperature.toFixed(2)),
        humidity: parseFloat(this.latestData.humidity.toFixed(2)),
        soilMoisture: Math.round(this.latestData.soilMoisture),
        timestamp: this.latestData.timestamp,
        source: 'Adafruit IO MQTT'
      });

      await newSensorData.save();

      logger.info('Sensor data saved successfully:', {
        id: newSensorData._id,
        temperature: newSensorData.temperature,
        humidity: newSensorData.humidity,
        soilMoisture: newSensorData.soilMoisture,
        timestamp: newSensorData.timestamp
      });

      // Emit real-time update via Socket.IO
      try {
        const io = getIO();
        const updateData = {
          temperature: newSensorData.temperature,
          humidity: newSensorData.humidity,
          soilMoisture: newSensorData.soilMoisture,
          timestamp: newSensorData.timestamp,
          needsIrrigation: newSensorData.soilMoisture < 300
        };
        
        io.emit('sensorDataUpdate', updateData);
        logger.info('Emitted sensorDataUpdate event via Socket.IO', updateData);
      } catch (ioError) {
        logger.warn('Failed to emit Socket.IO event:', ioError.message);
      }
      
      // Reset latest data cache
      this.latestData = {
        temperature: null,
        humidity: null,
        soilMoisture: null,
        timestamp: null
      };
    } catch (error) {
      logger.error('Error saving sensor data:', error.message);
    }
  }

  /**
   * Handle reconnection attempts
   */
  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error('Max MQTT reconnect attempts reached. Giving up.');
      return;
    }
    
    this.reconnectAttempts++;
    logger.info(`MQTT reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${this.reconnectDelay}ms`);
    
    setTimeout(() => {
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.connect();
      }
    }, this.reconnectDelay);
  }

  /**
   * Disconnect from MQTT broker
   */
  disconnect() {
    if (this.client) {
      this.client.end(true, () => {
        logger.info('Disconnected from Adafruit IO MQTT broker');
        this.isConnected = false;
      });
    }
  }

  /**
   * Get latest sensor data
   */
  getLatestData() {
    return { ...this.latestData };
  }

  /**
   * Check connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts
    };
  }
}

// Export singleton instance
module.exports = new MQTTAdafruitService();