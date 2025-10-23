// src/services/sensor-data-scheduler.service.js
const cron = require('node-cron');
const adafruitService = require('./adafruit.service');
const SensorData = require('../models/SensorData');
const logger = require('../utils/logger');
const { getIO } = require('./realtime.service');

class SensorDataScheduler {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the sensor data scheduler with cron jobs
   */
  start() {
    if (this.isRunning) {
      logger.warn('Sensor data scheduler is already running');
      return;
    }

    // Run every 5 minutes to fetch sensor data from Adafruit IO
    // Cron format: minute hour dayOfMonth month dayOfWeek
    cron.schedule('*/5 * * * *', async () => {
      logger.info('Running scheduled sensor data fetch...');
      await this.fetchAndStoreSensorData();
    });

    this.isRunning = true;
    logger.info('Sensor data scheduler started successfully - will fetch data every 5 minutes');
  }

  /**
   * Stop the sensor data scheduler
   */
  stop() {
    cron.destroy();
    this.isRunning = false;
    logger.info('Sensor data scheduler stopped');
  }

  /**
   * Fetch sensor data from Adafruit IO and save to database
   */
  async fetchAndStoreSensorData() {
    try {
      logger.info('Fetching sensor data from Adafruit IO...');

      // Fetch data from Adafruit IO
      const sensorData = await adafruitService.getAllSensorData();

      // Check for incomplete data with more detailed error message
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
        return;
      }

      // Validate data ranges
      if (sensorData.temperature < -50 || sensorData.temperature > 100) {
        logger.warn('Temperature value out of valid range:', sensorData.temperature);
        return;
      }

      if (sensorData.humidity < 0 || sensorData.humidity > 100) {
        logger.warn('Humidity value out of valid range:', sensorData.humidity);
        return;
      }

      if (sensorData.soilMoisture < 0 || sensorData.soilMoisture > 4095) {
        logger.warn('Soil moisture value out of valid range:', sensorData.soilMoisture);
        return;
      }

      // Check if data with this timestamp already exists (prevent duplicates)
      const existingData = await SensorData.findOne({
        timestamp: sensorData.timestamp
      });

      if (existingData) {
        logger.info('Sensor data with this timestamp already exists, skipping...');
        return;
      }

      // Save to database
      const newSensorData = new SensorData({
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        soilMoisture: sensorData.soilMoisture,
        timestamp: sensorData.timestamp,
        source: 'ESP32'
      });

      await newSensorData.save();

      logger.info('Sensor data saved successfully:', newSensorData._id);

      // Emit real-time update via Socket.IO
      try {
        const io = getIO();
        io.emit('sensorDataUpdate', {
          temperature: sensorData.temperature,
          humidity: sensorData.humidity,
          soilMoisture: sensorData.soilMoisture,
          timestamp: sensorData.timestamp,
          needsIrrigation: sensorData.soilMoisture < 300
        });
        logger.info('Emitted sensorDataUpdate event via Socket.IO');
      } catch (ioError) {
        logger.warn('Failed to emit Socket.IO event:', ioError.message);
      }

    } catch (error) {
      logger.error('Error in scheduled sensor data fetch:', error);
    }
  }

  /**
   * Manually trigger sensor data fetch (for testing)
   */
  async triggerManualFetch() {
    logger.info('Manual sensor data fetch triggered');
    await this.fetchAndStoreSensorData();
  }
}

// Create singleton instance
const sensorDataScheduler = new SensorDataScheduler();

module.exports = sensorDataScheduler;