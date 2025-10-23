// src/controllers/farm-monitoring.controller.js
const SensorData = require('../models/SensorData');
const adafruitService = require('../services/adafruit.service');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { getIO } = require('../services/realtime.service');

/**
 * Fetch sensor data from Adafruit IO and save to database
 */
const fetchAndStoreSensorData = async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(500).json({
        success: false,
        message: 'Database not connected',
        error: 'Database connection is not available'
      });
    }
    
    logger.info('Fetching sensor data from Adafruit IO...');
    console.log('Fetching sensor data from Adafruit IO...');

    // Fetch data from Adafruit IO
    const sensorData = await adafruitService.getAllSensorData();
    logger.info('Received sensor data from Adafruit IO:', sensorData);
    console.log('Received sensor data from Adafruit IO:', sensorData);

    // Instead of failing when data is missing, we'll proceed with what we have
    // but log a warning
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
      logger.warn('Some sensor data is missing:', {
        receivedData: sensorData,
        missingFields: missingFields
      });
      
      // If all fields are missing, it's a more serious issue
      if (missingFields.length === 3) {
        logger.error('All sensor data is missing - possible connection issue');
        return res.status(503).json({
          success: false,
          message: 'Unable to connect to sensor data source',
          details: 'All sensor feeds are currently unavailable',
          error: 'Service Unavailable'
        });
      }
      
      // If only some fields are missing, we'll continue but warn the user
      logger.info('Proceeding with partial sensor data');
    }

    // Validate data ranges only for data we actually received
    if (sensorData.temperature !== null && sensorData.temperature !== undefined) {
      if (sensorData.temperature < -50 || sensorData.temperature > 100) {
        return res.status(400).json({
          success: false,
          message: 'Temperature value out of valid range (-50°C to 100°C)',
          value: sensorData.temperature
        });
      }
    }

    if (sensorData.humidity !== null && sensorData.humidity !== undefined) {
      if (sensorData.humidity < 0 || sensorData.humidity > 100) {
        return res.status(400).json({
          success: false,
          message: 'Humidity value out of valid range (0% to 100%)',
          value: sensorData.humidity
        });
      }
    }

    if (sensorData.soilMoisture !== null && sensorData.soilMoisture !== undefined) {
      if (sensorData.soilMoisture < 0 || sensorData.soilMoisture > 4095) {
        return res.status(400).json({
          success: false,
          message: 'Soil moisture value out of valid range (0 to 4095)',
          value: sensorData.soilMoisture
        });
      }
    }

    // Check if we have ANY valid data before proceeding
    const hasValidData = (
      (sensorData.temperature !== null && sensorData.temperature !== undefined) ||
      (sensorData.humidity !== null && sensorData.humidity !== undefined) ||
      (sensorData.soilMoisture !== null && sensorData.soilMoisture !== undefined)
    );

    if (!hasValidData) {
      return res.status(400).json({
        success: false,
        message: 'No valid sensor data received',
        details: 'Unable to process any of the received sensor values'
      });
    }

    // Check if data with this timestamp already exists (prevent duplicates)
    const existingData = await SensorData.findOne({
      timestamp: sensorData.timestamp
    });

    if (existingData) {
      logger.info('Sensor data with this timestamp already exists, skipping...');
      return res.status(200).json({
        success: true,
        message: 'Sensor data already exists',
        data: existingData
      });
    }

    // Save to database - only save fields that have valid data
    const newSensorData = new SensorData({
      timestamp: sensorData.timestamp,
      source: 'ESP32',
      userId: req.user?.id || null
    });

    // Only add fields that have valid data
    if (sensorData.temperature !== null && sensorData.temperature !== undefined) {
      newSensorData.temperature = sensorData.temperature;
    }
    
    if (sensorData.humidity !== null && sensorData.humidity !== undefined) {
      newSensorData.humidity = sensorData.humidity;
    }
    
    if (sensorData.soilMoisture !== null && sensorData.soilMoisture !== undefined) {
      newSensorData.soilMoisture = sensorData.soilMoisture;
    }

    await newSensorData.save();

    logger.info('Sensor data saved successfully:', newSensorData._id);
    console.log('Sensor data saved successfully:', newSensorData._id);

    // Emit real-time update via Socket.IO
    try {
      const io = getIO();
      const updateData = {
        timestamp: sensorData.timestamp
      };
      
      // Only include fields that have valid data
      if (sensorData.temperature !== null && sensorData.temperature !== undefined) {
        updateData.temperature = sensorData.temperature;
      }
      
      if (sensorData.humidity !== null && sensorData.humidity !== undefined) {
        updateData.humidity = sensorData.humidity;
      }
      
      if (sensorData.soilMoisture !== null && sensorData.soilMoisture !== undefined) {
        updateData.soilMoisture = sensorData.soilMoisture;
        updateData.needsIrrigation = sensorData.soilMoisture < 300;
      }
      
      io.emit('sensorDataUpdate', updateData);
      logger.info('Emitted sensorDataUpdate event via Socket.IO', updateData);
      console.log('Emitted sensorDataUpdate event via Socket.IO', updateData);
    } catch (ioError) {
      logger.warn('Failed to emit Socket.IO event:', ioError.message);
      console.log('Failed to emit Socket.IO event:', ioError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Sensor data fetched and stored successfully',
      data: newSensorData,
      partialData: missingFields.length > 0
    });

  } catch (error) {
    logger.error('Error fetching and storing sensor data:', {
      message: error.message,
      stack: error.stack
    });
    console.error('Error fetching and storing sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch and store sensor data',
      error: error.message
    });
  }
};

/**
 * Get latest sensor reading
 */
const getLatestReading = async (req, res) => {
  try {
    const latestData = await SensorData.getLatest();

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        ...latestData.toObject(),
        statusMessage: latestData.getStatusMessage(),
        needsIrrigation: latestData.needsIrrigation
      }
    });

  } catch (error) {
    logger.error('Error fetching latest sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest sensor data',
      error: error.message
    });
  }
};

/**
 * Get historical sensor data
 */
const getHistoricalData = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const limit = parseInt(req.query.limit) || 100;

    if (hours < 1 || hours > 168) { // Max 7 days
      return res.status(400).json({
        success: false,
        message: 'Hours must be between 1 and 168 (7 days)'
      });
    }

    const historicalData = await SensorData.getHistorical(hours);

    // If we have more data than the limit, sample it evenly
    let sampledData = historicalData;
    if (historicalData.length > limit) {
      const step = Math.floor(historicalData.length / limit);
      sampledData = historicalData.filter((_, index) => index % step === 0);
    }

    res.status(200).json({
      success: true,
      data: sampledData,
      totalRecords: historicalData.length,
      sampledRecords: sampledData.length
    });

  } catch (error) {
    logger.error('Error fetching historical sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch historical sensor data',
      error: error.message
    });
  }
};

/**
 * Get sensor statistics
 */
const getSensorStats = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = await SensorData.getHistorical(hours);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available for the specified period'
      });
    }

    // Calculate statistics
    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);
    const soilMoistures = data.map(d => d.soilMoisture);

    const stats = {
      temperature: {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        avg: temperatures.reduce((a, b) => a + b, 0) / temperatures.length,
        current: temperatures[temperatures.length - 1]
      },
      humidity: {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        avg: humidities.reduce((a, b) => a + b, 0) / humidities.length,
        current: humidities[humidities.length - 1]
      },
      soilMoisture: {
        min: Math.min(...soilMoistures),
        max: Math.max(...soilMoistures),
        avg: soilMoistures.reduce((a, b) => a + b, 0) / soilMoistures.length,
        current: soilMoistures[soilMoistures.length - 1]
      },
      dataPoints: data.length,
      period: `${hours} hours`
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Error calculating sensor statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate sensor statistics',
      error: error.message
    });
  }
};

/**
 * Manually add sensor data (for testing)
 */
const addSensorData = async (req, res) => {
  try {
    const { temperature, humidity, soilMoisture, timestamp } = req.body;

    // Validate required fields
    if (temperature === undefined || humidity === undefined || soilMoisture === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Temperature, humidity, and soilMoisture are required'
      });
    }

    // Validate data ranges
    if (temperature < -50 || temperature > 100) {
      return res.status(400).json({
        success: false,
        message: 'Temperature value out of valid range (-50°C to 100°C)',
        value: temperature
      });
    }

    if (humidity < 0 || humidity > 100) {
      return res.status(400).json({
        success: false,
        message: 'Humidity value out of valid range (0% to 100%)',
        value: humidity
      });
    }

    if (soilMoisture < 0 || soilMoisture > 4095) {
      return res.status(400).json({
        success: false,
        message: 'Soil moisture value out of valid range (0 to 4095)',
        value: soilMoisture
      });
    }

    const newSensorData = new SensorData({
      temperature,
      humidity,
      soilMoisture,
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: 'Manual',
      userId: req.user?.id || null
    });

    await newSensorData.save();

    // Emit real-time update via Socket.IO
    try {
      const io = getIO();
      io.emit('sensorDataUpdate', {
        temperature,
        humidity,
        soilMoisture,
        timestamp: newSensorData.timestamp,
        needsIrrigation: soilMoisture < 300
      });
      logger.info('Emitted sensorDataUpdate event via Socket.IO for manual data');
    } catch (ioError) {
      logger.warn('Failed to emit Socket.IO event:', ioError.message);
    }

    res.status(201).json({
      success: true,
      message: 'Sensor data added successfully',
      data: newSensorData
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Sensor data with this timestamp already exists'
      });
    }

    logger.error('Error adding sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add sensor data',
      error: error.message
    });
  }
};

/**
 * Delete old sensor data (cleanup)
 */
const cleanupOldData = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await SensorData.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Deleted ${result.deletedCount} old sensor data records`);

    res.status(200).json({
      success: true,
      message: `Deleted ${result.deletedCount} records older than ${days} days`,
      deletedCount: result.deletedCount
    });

  } catch (error) {
    logger.error('Error cleaning up old sensor data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old sensor data',
      error: error.message
    });
  }
};

/**
 * Export sensor data as CSV
 */
const exportSensorDataCSV = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = await SensorData.getHistorical(hours);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available for export'
      });
    }

    // Create CSV content
    let csvContent = 'Timestamp,Temperature (°C),Humidity (%),Soil Moisture,Source\n';
    data.forEach(record => {
      csvContent += `"${record.timestamp.toISOString()}",${record.temperature},${record.humidity},${record.soilMoisture},"${record.source}"\n`;
    });

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sensor-data-${new Date().toISOString().slice(0, 10)}.csv`);

    res.status(200).send(csvContent);

  } catch (error) {
    logger.error('Error exporting sensor data as CSV:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export sensor data',
      error: error.message
    });
  }
};

/**
 * Enhanced predictive analytics for crop conditions
 */
const getPredictiveAnalytics = async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const data = await SensorData.getHistorical(hours);

    if (data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available for analysis'
      });
    }

    // Simple trend analysis using linear regression
    const temperatures = data.map(d => d.temperature);
    const humidities = data.map(d => d.humidity);
    const soilMoistures = data.map(d => d.soilMoisture);

    // Calculate trends (simple linear regression slope)
    const calculateTrend = (values) => {
      const n = values.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
      
      for (let i = 0; i < n; i++) {
        sumX += i;
        sumY += values[i];
        sumXY += i * values[i];
        sumXX += i * i;
      }
      
      return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    };

    // Calculate moving averages for smoother trends
    const calculateMovingAverage = (values, windowSize = 5) => {
      if (values.length < windowSize) return values[values.length - 1] || 0;
      
      const sum = values.slice(-windowSize).reduce((a, b) => a + b, 0);
      return sum / windowSize;
    };

    // Calculate standard deviations for volatility
    const calculateStdDev = (values) => {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const squareDiffs = values.map(value => Math.pow(value - avg, 2));
      const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
      return Math.sqrt(avgSquareDiff);
    };

    // Enhanced analytics with multiple metrics
    const analytics = {
      temperature: {
        trend: calculateTrend(temperatures),
        movingAverage: calculateMovingAverage(temperatures),
        stdDev: calculateStdDev(temperatures),
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        current: temperatures[temperatures.length - 1]
      },
      humidity: {
        trend: calculateTrend(humidities),
        movingAverage: calculateMovingAverage(humidities),
        stdDev: calculateStdDev(humidities),
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        current: humidities[humidities.length - 1]
      },
      soilMoisture: {
        trend: calculateTrend(soilMoistures),
        movingAverage: calculateMovingAverage(soilMoistures),
        stdDev: calculateStdDev(soilMoistures),
        min: Math.min(...soilMoistures),
        max: Math.max(...soilMoistures),
        current: soilMoistures[soilMoistures.length - 1]
      },
      irrigationNeeded: soilMoistures[soilMoistures.length - 1] < 300,
      dataPoints: data.length,
      period: `${hours} hours`,
      recommendations: []
    };

    // Generate recommendations based on trends and current conditions
    // Temperature recommendations
    if (analytics.temperature.trend > 0.5) {
      analytics.recommendations.push('Temperature is rising rapidly. Consider shade protection for crops.');
    } else if (analytics.temperature.trend < -0.5) {
      analytics.recommendations.push('Temperature is dropping rapidly. Consider protective measures for cold-sensitive crops.');
    }
    
    if (analytics.temperature.current > 35) {
      analytics.recommendations.push('High temperature detected. Provide cooling or shade for crops.');
    } else if (analytics.temperature.current < 5) {
      analytics.recommendations.push('Low temperature detected. Protect crops from frost.');
    }

    // Humidity recommendations
    if (analytics.humidity.trend > 0.5) {
      analytics.recommendations.push('Humidity is increasing. Monitor for fungal diseases.');
    } else if (analytics.humidity.trend < -0.5) {
      analytics.recommendations.push('Humidity is decreasing. Crops may need more frequent watering.');
    }
    
    if (analytics.humidity.current > 85) {
      analytics.recommendations.push('High humidity detected. Increase ventilation to prevent fungal growth.');
    } else if (analytics.humidity.current < 20) {
      analytics.recommendations.push('Low humidity detected. Increase watering frequency or humidity.');
    }

    // Soil moisture recommendations
    if (analytics.soilMoisture.trend < -10) {
      analytics.recommendations.push('Soil moisture is decreasing rapidly. Irrigation may be needed soon.');
    } else if (analytics.soilMoisture.trend > 10) {
      analytics.recommendations.push('Soil moisture is increasing. Check for proper drainage.');
    }
    
    if (analytics.soilMoisture.current < 300) {
      analytics.recommendations.push('Soil moisture is critically low. Immediate irrigation required.');
    } else if (analytics.soilMoisture.current < 500) {
      analytics.recommendations.push('Soil moisture is low. Consider irrigation soon.');
    } else if (analytics.soilMoisture.current > 1000) {
      analytics.recommendations.push('Soil moisture is high. Check drainage to prevent waterlogging.');
    }

    // Volatility warnings
    if (analytics.temperature.stdDev > 5) {
      analytics.recommendations.push('Temperature is highly variable. Consider stabilizing environmental conditions.');
    }
    
    if (analytics.humidity.stdDev > 10) {
      analytics.recommendations.push('Humidity is highly variable. Monitor crops for stress signs.');
    }
    
    if (analytics.soilMoisture.stdDev > 100) {
      analytics.recommendations.push('Soil moisture is highly variable. Check irrigation system consistency.');
    }

    // Predictive alerts based on trends
    const predictFutureValue = (current, trend, timeSteps = 6) => {
      return current + (trend * timeSteps);
    };
    
    // Predict soil moisture in 6 hours
    const predictedSoilMoisture = predictFutureValue(
      analytics.soilMoisture.current, 
      analytics.soilMoisture.trend
    );
    
    if (predictedSoilMoisture < 300) {
      analytics.recommendations.push('Prediction: Soil moisture may drop below critical level in next 6 hours. Plan irrigation.');
    }

    res.status(200).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error performing predictive analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform predictive analytics',
      error: error.message
    });
  }
};

/**
 * Get alert conditions with enhanced alerting
 */
const getAlerts = async (req, res) => {
  try {
    const latestData = await SensorData.getLatest();

    if (!latestData) {
      return res.status(404).json({
        success: false,
        message: 'No sensor data available'
      });
    }

    const alerts = [];

    // Temperature alerts
    if (latestData.temperature > 40) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        message: 'Critical high temperature detected! Current: ' + latestData.temperature + '°C',
        recommendation: 'Immediate cooling or shade required'
      });
    } else if (latestData.temperature > 35) {
      alerts.push({
        type: 'temperature',
        severity: 'high',
        message: 'High temperature detected! Current: ' + latestData.temperature + '°C',
        recommendation: 'Provide shade or cooling for crops'
      });
    } else if (latestData.temperature < 0) {
      alerts.push({
        type: 'temperature',
        severity: 'critical',
        message: 'Critical low temperature detected! Current: ' + latestData.temperature + '°C',
        recommendation: 'Immediate protection from frost required'
      });
    } else if (latestData.temperature < 5) {
      alerts.push({
        type: 'temperature',
        severity: 'high',
        message: 'Low temperature detected! Current: ' + latestData.temperature + '°C',
        recommendation: 'Protect crops from frost'
      });
    }

    // Humidity alerts
    if (latestData.humidity > 90) {
      alerts.push({
        type: 'humidity',
        severity: 'high',
        message: 'Very high humidity detected! Current: ' + latestData.humidity + '%',
        recommendation: 'Increase ventilation immediately to prevent fungal diseases'
      });
    } else if (latestData.humidity > 85) {
      alerts.push({
        type: 'humidity',
        severity: 'medium',
        message: 'High humidity detected! Current: ' + latestData.humidity + '%',
        recommendation: 'Monitor for fungal diseases'
      });
    } else if (latestData.humidity < 15) {
      alerts.push({
        type: 'humidity',
        severity: 'high',
        message: 'Very low humidity detected! Current: ' + latestData.humidity + '%',
        recommendation: 'Increase watering frequency immediately'
      });
    } else if (latestData.humidity < 20) {
      alerts.push({
        type: 'humidity',
        severity: 'medium',
        message: 'Low humidity detected! Current: ' + latestData.humidity + '%',
        recommendation: 'Increase watering frequency'
      });
    }

    // Soil moisture alerts
    if (latestData.soilMoisture < 200) {
      alerts.push({
        type: 'soilMoisture',
        severity: 'critical',
        message: 'Critical low soil moisture detected! Current: ' + latestData.soilMoisture,
        recommendation: 'Immediate emergency irrigation required'
      });
    } else if (latestData.soilMoisture < 300) {
      alerts.push({
        type: 'soilMoisture',
        severity: 'high',
        message: 'Low soil moisture detected! Current: ' + latestData.soilMoisture,
        recommendation: 'Immediate irrigation required'
      });
    } else if (latestData.soilMoisture > 1200) {
      alerts.push({
        type: 'soilMoisture',
        severity: 'high',
        message: 'Very high soil moisture detected! Current: ' + latestData.soilMoisture,
        recommendation: 'Check drainage immediately to prevent waterlogging'
      });
    } else if (latestData.soilMoisture > 1000) {
      alerts.push({
        type: 'soilMoisture',
        severity: 'medium',
        message: 'High soil moisture detected! Current: ' + latestData.soilMoisture,
        recommendation: 'Check drainage to prevent waterlogging'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        alerts,
        timestamp: latestData.timestamp
      }
    });

  } catch (error) {
    logger.error('Error fetching alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: error.message
    });
  }
};

/**
 * Create a custom alert
 */
const createCustomAlert = async (req, res) => {
  try {
    const { type, threshold, condition, severity, message, recommendation } = req.body;
    
    // Validate required fields
    if (!type || !threshold || !condition || !severity || !message) {
      return res.status(400).json({
        success: false,
        message: 'Type, threshold, condition, severity, and message are required'
      });
    }
    
    // Validate condition
    const validConditions = ['above', 'below', 'equal'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: 'Condition must be one of: above, below, equal'
      });
    }
    
    // Validate severity
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (!validSeverities.includes(severity)) {
      return res.status(400).json({
        success: false,
        message: 'Severity must be one of: low, medium, high, critical'
      });
    }
    
    // In a real implementation, you would save this to a database
    // For now, we'll just return success
    res.status(201).json({
      success: true,
      message: 'Custom alert created successfully',
      data: {
        type,
        threshold,
        condition,
        severity,
        message,
        recommendation
      }
    });
  } catch (error) {
    logger.error('Error creating custom alert:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create custom alert',
      error: error.message
    });
  }
};

/**
 * Get all custom alerts
 */
const getCustomAlerts = async (req, res) => {
  try {
    // In a real implementation, you would fetch from a database
    // For now, we'll return an empty array
    res.status(200).json({
      success: true,
      data: []
    });
  } catch (error) {
    logger.error('Error fetching custom alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch custom alerts',
      error: error.message
    });
  }
};

module.exports = {
  fetchAndStoreSensorData,
  getLatestReading,
  getHistoricalData,
  getSensorStats,
  addSensorData,
  cleanupOldData,
  exportSensorDataCSV,
  getPredictiveAnalytics,
  getAlerts,
  createCustomAlert,
  getCustomAlerts
};