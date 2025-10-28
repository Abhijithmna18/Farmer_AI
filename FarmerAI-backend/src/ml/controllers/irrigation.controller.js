// Irrigation Optimization Controller
const MLService = require('../services/ml-service');
const IrrigationSchedule = require('../models/IrrigationSchedule');
const SensorData = require('../../models/SensorData');
const WeatherService = require('../../services/weather.service');

// Optimize irrigation schedule based on farm data
const optimizeIrrigation = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      farmId,
      cropType,
      soilType,
      area,
      irrigationType,
      waterSource,
      budget
    } = req.body;

    if (!farmId || !cropType || !soilType || !area) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID, crop type, soil type, and area are required'
      });
    }

    // Get recent sensor data
    const sensorData = await SensorData.find({ farmId })
      .sort({ timestamp: -1 })
      .limit(24) // Last 24 readings
      .select('temperature humidity soilMoisture lightIntensity timestamp');

    // Get weather forecast
    const weatherData = await WeatherService.getWeatherForecast(farmId, 7);

    // Get irrigation history
    const irrigationHistory = await IrrigationSchedule.find({ farmId })
      .sort({ createdAt: -1 })
      .limit(30) // Last 30 days
      .select('schedule waterUsage efficiency createdAt');

    // Prepare data for ML service
    const farmData = {
      farmId,
      cropType,
      soilType,
      area: parseFloat(area),
      irrigationType: irrigationType || 'drip',
      waterSource: waterSource || 'groundwater',
      budget: parseFloat(budget) || 1000,
      sensorData: sensorData.map(s => ({
        temperature: s.temperature,
        humidity: s.humidity,
        soilMoisture: s.soilMoisture,
        lightIntensity: s.lightIntensity,
        timestamp: s.timestamp
      })),
      weatherData: weatherData.forecast || [],
      irrigationHistory: irrigationHistory.map(i => ({
        schedule: i.schedule,
        waterUsage: i.waterUsage,
        efficiency: i.efficiency,
        date: i.createdAt
      }))
    };

    // Call ML service for irrigation optimization
    const mlResult = await MLService.optimizeIrrigation(farmData);

    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Irrigation optimization failed',
        error: mlResult.error
      });
    }

    const { schedule, waterUsage, efficiency, recommendations } = mlResult.data;

    // Save optimized schedule to database
    const irrigationSchedule = new IrrigationSchedule({
      farmId,
      userId,
      cropType,
      soilType,
      area: parseFloat(area),
      schedule: schedule.map(s => ({
        date: new Date(s.date),
        amount: s.amount,
        duration: s.duration,
        reason: s.reason,
        priority: s.priority || 'Medium'
      })),
      waterUsage: waterUsage,
      efficiency: efficiency,
      recommendations: recommendations || [],
      irrigationType: irrigationType || 'drip',
      waterSource: waterSource || 'groundwater',
      budget: parseFloat(budget) || 1000,
      status: 'Active'
    });

    await irrigationSchedule.save();

    // Log the operation
    await MLService.logMLOperation(
      'irrigation_optimization',
      'irrigation-optimization',
      userId,
      { farmId, cropType, soilType, area },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        scheduleId: irrigationSchedule._id,
        schedule: irrigationSchedule.schedule,
        waterUsage: irrigationSchedule.waterUsage,
        efficiency: irrigationSchedule.efficiency,
        recommendations: irrigationSchedule.recommendations,
        estimatedCost: irrigationSchedule.budget,
        nextIrrigation: irrigationSchedule.schedule[0]?.date,
        status: irrigationSchedule.status
      }
    });

  } catch (error) {
    console.error('Irrigation optimization error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during irrigation optimization',
      error: error.message
    });
  }
};

// Get irrigation schedule for farm
const getIrrigationSchedule = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;

    const schedule = await IrrigationSchedule.findOne({
      farmId,
      userId,
      status: 'Active'
    }).sort({ createdAt: -1 });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No active irrigation schedule found for this farm'
      });
    }

    res.json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Get irrigation schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch irrigation schedule',
      error: error.message
    });
  }
};

// Update irrigation schedule
const updateIrrigationSchedule = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const userId = req.user.id || req.user._id;
    const updates = req.body;

    const schedule = await IrrigationSchedule.findOne({
      _id: scheduleId,
      userId
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Irrigation schedule not found'
      });
    }

    // Update schedule fields
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        schedule[key] = updates[key];
      }
    });

    schedule.updatedAt = new Date();
    await schedule.save();

    res.json({
      success: true,
      data: schedule,
      message: 'Irrigation schedule updated successfully'
    });

  } catch (error) {
    console.error('Update irrigation schedule error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update irrigation schedule',
      error: error.message
    });
  }
};

// Get water usage forecast
const getWaterUsageForecast = async (req, res) => {
  try {
    const { farmId } = req.params;
    const { days = 7 } = req.query;
    const userId = req.user.id || req.user._id;

    // Get current irrigation schedule
    const schedule = await IrrigationSchedule.findOne({
      farmId,
      userId,
      status: 'Active'
    }).sort({ createdAt: -1 });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'No active irrigation schedule found'
      });
    }

    // Calculate forecast based on schedule
    const forecast = [];
    const startDate = new Date();
    
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const daySchedule = schedule.schedule.find(s => {
        const scheduleDate = new Date(s.date);
        return scheduleDate.toDateString() === date.toDateString();
      });

      forecast.push({
        date: date.toISOString().split('T')[0],
        waterUsage: daySchedule ? daySchedule.amount : 0,
        duration: daySchedule ? daySchedule.duration : 0,
        reason: daySchedule ? daySchedule.reason : 'No irrigation scheduled'
      });
    }

    res.json({
      success: true,
      data: {
        farmId,
        forecast,
        totalWaterUsage: forecast.reduce((sum, day) => sum + day.waterUsage, 0),
        averageDailyUsage: forecast.reduce((sum, day) => sum + day.waterUsage, 0) / forecast.length
      }
    });

  } catch (error) {
    console.error('Get water usage forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch water usage forecast',
      error: error.message
    });
  }
};

// Get irrigation history
const getIrrigationHistory = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const schedules = await IrrigationSchedule.find({
      farmId,
      userId
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('-__v');

    const total = await IrrigationSchedule.countDocuments({
      farmId,
      userId
    });

    res.json({
      success: true,
      data: {
        schedules,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get irrigation history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch irrigation history',
      error: error.message
    });
  }
};

// Set irrigation alert
const setIrrigationAlert = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    const { alertType, threshold, enabled = true } = req.body;

    // This would integrate with a notification service
    // For now, we'll just store the alert preferences
    
    const alert = {
      farmId,
      userId,
      alertType, // 'low_moisture', 'high_usage', 'schedule_reminder'
      threshold,
      enabled,
      createdAt: new Date()
    };

    // TODO: Implement proper alert storage and notification system
    console.log('Irrigation alert set:', alert);

    res.json({
      success: true,
      data: alert,
      message: 'Irrigation alert set successfully'
    });

  } catch (error) {
    console.error('Set irrigation alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set irrigation alert',
      error: error.message
    });
  }
};

module.exports = {
  optimizeIrrigation,
  getIrrigationSchedule,
  updateIrrigationSchedule,
  getWaterUsageForecast,
  getIrrigationHistory,
  setIrrigationAlert
};
