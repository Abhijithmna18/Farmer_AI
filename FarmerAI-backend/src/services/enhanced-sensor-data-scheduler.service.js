// src/services/enhanced-sensor-data-scheduler.service.js
const cron = require('node-cron');
const adafruitService = require('./adafruit.service');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');
const { getIO } = require('./realtime.service');
const mongoose = require('mongoose');

// Enhanced Sensor Data Scheduler Service
// This service provides robust, production-ready automatic fetching of sensor data
// from Adafruit IO every 5 minutes with comprehensive error handling and retry logic.

class EnhancedSensorDataScheduler {
  constructor() {
    this.isRunning = false;
    this.retryAttempts = 0;
    this.maxRetries = 3;
    this.retryDelay = 5000; // 5 seconds
  }

  // Start the sensor data scheduler with cron jobs
  // The cron expression '*/5 * * * *' means:
  // - */5: Every 5 minutes
  // - *: Every hour
  // - *: Every day
  // - *: Every month
  // - *: Every day of the week
  start() {
    if (this.isRunning) {
      logger.warn('Enhanced sensor data scheduler is already running');
      return;
    }

    // Run every 5 minutes to fetch sensor data from Adafruit IO
    // Cron format: minute hour dayOfMonth month dayOfWeek
    this.cronJob = cron.schedule('*/5 * * * *', async () => {
      logger.info('Running scheduled sensor data fetch...');
      // Check if database is connected before proceeding
      if (mongoose.connection.readyState !== 1) {
        logger.warn('Database not connected, skipping scheduled fetch');
        return;
      }
      await this.fetchAndStoreSensorDataWithRetry();
    });

    this.isRunning = true;
    logger.info('Enhanced sensor data scheduler started successfully - will fetch data every 5 minutes');
  }

  // Stop the sensor data scheduler
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
    }
    this.isRunning = false;
    this.retryAttempts = 0;
    logger.info('Enhanced sensor data scheduler stopped');
  }

  // Fetch sensor data with retry mechanism
  // This method implements exponential backoff retry logic to handle
  // temporary network issues or Adafruit IO service disruptions.
  async fetchAndStoreSensorDataWithRetry() {
    // Check if database is connected before proceeding
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Database not connected, skipping fetch and retry');
      return;
    }
    
    try {
      await this.fetchAndStoreSensorData();
      // Reset retry attempts on success
      this.retryAttempts = 0;
    } catch (error) {
      this.retryAttempts++;
      logger.warn(`Sensor data fetch failed (attempt ${this.retryAttempts}/${this.maxRetries}):`, {
        message: error.message,
        stack: error.stack
      });
      
      if (this.retryAttempts < this.maxRetries) {
        // Schedule retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
        logger.info(`Scheduling retry in ${delay}ms`);
        
        setTimeout(async () => {
          // Check if database is still connected before retrying
          if (mongoose.connection.readyState === 1) {
            await this.fetchAndStoreSensorDataWithRetry();
          } else {
            logger.warn('Database not connected, skipping retry');
          }
        }, delay);
      } else {
        logger.error('Max retry attempts reached. Giving up on sensor data fetch for this interval.', {
          retryAttempts: this.retryAttempts,
          maxRetries: this.maxRetries
        });
        this.retryAttempts = 0; // Reset for next interval
      }
    }
  }

  // Fetch sensor data from Adafruit IO and save to database
  // This method handles the complete data fetching pipeline:
  // 1. Fetch data from Adafruit IO
  // 2. Validate and sanitize the data
  // 3. Check for duplicates
  // 4. Save to database
  // 5. Emit real-time updates via Socket.IO
  async fetchAndStoreSensorData() {
    // Check if database is connected before proceeding
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }
    
    try {
      logger.info('Fetching sensor data from Adafruit IO...');
      console.log('Fetching sensor data from Adafruit IO...');
      
      // Fetch data from Adafruit IO
      const sensorData = await adafruitService.getAllSensorData();
      logger.info('Received sensor data from Adafruit IO:', sensorData);
      console.log('Received sensor data from Adafruit IO:', sensorData);
      
      // Validate that we received data
      if (!sensorData) {
        throw new Error('No data received from Adafruit IO');
      }

      // Check for incomplete data with detailed error message
      const missingFields = [];
      if (sensorData.temperature === null || sensorData.temperature === undefined) {
        missingFields.push('temperature');
      }
      if (sensorData.humidity === null || sensorData.humidity === undefined) {
        missingFields.push('humidity');
      }
      if (sensorData.soilMoisture === null || sensorData.soilMoisture === undefined) {
        missingFields.push('soil moisture');
      }

      if (missingFields.length > 0) {
        // Log detailed information about what's missing
        logger.warn('Incomplete sensor data received:', {
          receivedData: sensorData,
          missingFields: missingFields
        });
        throw new Error(`Missing sensor data fields: ${missingFields.join(', ')}`);
      }

      // Validate data ranges
      if (typeof sensorData.temperature !== 'number' || sensorData.temperature < -50 || sensorData.temperature > 100) {
        logger.warn('Temperature value out of valid range:', sensorData.temperature);
        throw new Error(`Invalid temperature value: ${sensorData.temperature}. Must be between -50°C and 100°C.`);
      }

      if (typeof sensorData.humidity !== 'number' || sensorData.humidity < 0 || sensorData.humidity > 100) {
        logger.warn('Humidity value out of valid range:', sensorData.humidity);
        throw new Error(`Invalid humidity value: ${sensorData.humidity}. Must be between 0% and 100%.`);
      }

      if (typeof sensorData.soilMoisture !== 'number' || sensorData.soilMoisture < 0 || sensorData.soilMoisture > 4095) {
        logger.warn('Soil moisture value out of valid range:', sensorData.soilMoisture);
        throw new Error(`Invalid soil moisture value: ${sensorData.soilMoisture}. Must be between 0 and 4095.`);
      }

      // Check if data with this timestamp already exists (prevent duplicates)
      const existingData = await SensorData.findOne({
        timestamp: sensorData.timestamp
      });

      if (existingData) {
        logger.info('Sensor data with this timestamp already exists, skipping...');
        console.log('Sensor data with this timestamp already exists, skipping...');
        return;
      }

      // Save to database
      const newSensorData = new SensorData({
        temperature: parseFloat(sensorData.temperature.toFixed(2)), // Round to 2 decimal places
        humidity: parseFloat(sensorData.humidity.toFixed(2)), // Round to 2 decimal places
        soilMoisture: Math.round(sensorData.soilMoisture), // Round to integer
        timestamp: sensorData.timestamp,
        source: 'Adafruit IO'
      });

      await newSensorData.save();

      logger.info('Sensor data saved successfully:', {
        id: newSensorData._id,
        temperature: newSensorData.temperature,
        humidity: newSensorData.humidity,
        soilMoisture: newSensorData.soilMoisture,
        timestamp: newSensorData.timestamp
      });
      console.log('Sensor data saved successfully:', {
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
        console.log('Emitted sensorDataUpdate event via Socket.IO', updateData);
      } catch (ioError) {
        logger.warn('Failed to emit Socket.IO event:', ioError.message);
        console.log('Failed to emit Socket.IO event:', ioError.message);
      }

      return newSensorData;
    } catch (error) {
      logger.error('Error in scheduled sensor data fetch:', {
        message: error.message,
        stack: error.stack
      });
      console.error('Error in scheduled sensor data fetch:', error);
      throw error; // Re-throw to trigger retry mechanism
    }
  }

  // Manually trigger sensor data fetch (for testing or on-demand updates)
  async triggerManualFetch() {
    logger.info('Manual sensor data fetch triggered');
    return await this.fetchAndStoreSensorDataWithRetry();
  }
  
  // Get scheduler status
  getStatus() {
    return {
      isRunning: this.isRunning,
      retryAttempts: this.retryAttempts,
      maxRetries: this.maxRetries
    };
  }
}

// Create singleton instance
const enhancedSensorDataScheduler = new EnhancedSensorDataScheduler();

module.exports = enhancedSensorDataScheduler;