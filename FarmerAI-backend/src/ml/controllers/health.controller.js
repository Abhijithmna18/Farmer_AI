// Health Monitoring Controller
const MLService = require('../services/ml-service');
const HealthScore = require('../models/HealthScore');
const SensorData = require('../../models/SensorData');

// Monitor crop health and detect anomalies
const monitorHealth = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { farmId, sensorData } = req.body;

    if (!farmId || !sensorData) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID and sensor data are required'
      });
    }

    // Get historical sensor data for comparison
    const historicalData = await SensorData.find({ farmId })
      .sort({ timestamp: -1 })
      .limit(100) // Last 100 readings
      .select('temperature humidity soilMoisture lightIntensity timestamp');

    // Call ML service for health monitoring
    const mlResult = await MLService.monitorHealth(sensorData, farmId);

    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Health monitoring failed',
        error: mlResult.error
      });
    }

    const { healthScore, anomalies, recommendations, riskLevel } = mlResult.data;

    // Save health score to database
    const healthRecord = new HealthScore({
      farmId,
      userId,
      score: healthScore,
      anomalies: anomalies.map(anomaly => ({
        type: anomaly.type,
        severity: anomaly.severity,
        description: anomaly.description,
        timestamp: new Date(anomaly.timestamp),
        sensorData: anomaly.sensorData
      })),
      recommendations: recommendations || [],
      riskLevel: riskLevel || 'Low',
      sensorData: {
        temperature: sensorData.temperature,
        humidity: sensorData.humidity,
        soilMoisture: sensorData.soilMoisture,
        lightIntensity: sensorData.lightIntensity,
        lastUpdated: new Date()
      }
    });

    await healthRecord.save();

    // Log the operation
    await MLService.logMLOperation(
      'health_monitoring',
      'health-monitoring',
      userId,
      { farmId, sensorData },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        healthScore,
        riskLevel: healthRecord.riskLevel,
        anomalies: healthRecord.anomalies,
        recommendations: healthRecord.recommendations,
        recordId: healthRecord._id,
        timestamp: healthRecord.createdAt
      }
    });

  } catch (error) {
    console.error('Health monitoring error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during health monitoring',
      error: error.message
    });
  }
};

// Get current health score for farm
const getHealthScore = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;

    const healthScore = await HealthScore.findOne({
      farmId,
      userId
    }).sort({ createdAt: -1 });

    if (!healthScore) {
      return res.status(404).json({
        success: false,
        message: 'No health score found for this farm'
      });
    }

    res.json({
      success: true,
      data: healthScore
    });

  } catch (error) {
    console.error('Get health score error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health score',
      error: error.message
    });
  }
};

// Get anomalies for farm
const getAnomalies = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10, severity } = req.query;

    const query = { farmId, userId };
    if (severity) {
      query['anomalies.severity'] = severity;
    }

    const healthScores = await HealthScore.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('anomalies score riskLevel createdAt');

    // Flatten anomalies from all records
    const allAnomalies = [];
    healthScores.forEach(record => {
      record.anomalies.forEach(anomaly => {
        allAnomalies.push({
          ...anomaly.toObject(),
          recordId: record._id,
          healthScore: record.score,
          riskLevel: record.riskLevel,
          createdAt: record.createdAt
        });
      });
    });

    // Sort by timestamp
    allAnomalies.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    const total = await HealthScore.countDocuments(query);

    res.json({
      success: true,
      data: {
        anomalies: allAnomalies,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get anomalies error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch anomalies',
      error: error.message
    });
  }
};

// Get health history for farm
const getHealthHistory = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    const { period = '30' } = req.query; // days

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const healthHistory = await HealthScore.find({
      farmId,
      userId,
      createdAt: { $gte: startDate }
    })
    .sort({ createdAt: -1 })
    .select('score riskLevel anomalies recommendations createdAt');

    // Calculate health trends
    const scores = healthHistory.map(record => record.score);
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const trend = scores.length > 1 ? (scores[0] - scores[scores.length - 1]) : 0;

    res.json({
      success: true,
      data: {
        history: healthHistory,
        statistics: {
          averageScore: Math.round(avgScore * 100) / 100,
          trend: Math.round(trend * 100) / 100,
          totalRecords: healthHistory.length,
          period: `${period} days`
        }
      }
    });

  } catch (error) {
    console.error('Get health history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health history',
      error: error.message
    });
  }
};

// Set health alert
const setHealthAlert = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    const { alertType, threshold, enabled = true } = req.body;

    // This would integrate with a notification service
    // For now, we'll just store the alert preferences
    
    const alert = {
      farmId,
      userId,
      alertType, // 'low_score', 'anomaly_detected', 'risk_increase'
      threshold,
      enabled,
      createdAt: new Date()
    };

    // TODO: Implement proper alert storage and notification system
    console.log('Health alert set:', alert);

    res.json({
      success: true,
      data: alert,
      message: 'Health alert set successfully'
    });

  } catch (error) {
    console.error('Set health alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set health alert',
      error: error.message
    });
  }
};

// Get health recommendations
const getHealthRecommendations = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;

    const healthScore = await HealthScore.findOne({
      farmId,
      userId
    }).sort({ createdAt: -1 });

    if (!healthScore) {
      return res.status(404).json({
        success: false,
        message: 'No health data found for this farm'
      });
    }

    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Generate recommendations based on health score and anomalies
    if (healthScore.score < 0.3) {
      recommendations.immediate.push('Urgent: Crop health is critical - immediate intervention required');
    } else if (healthScore.score < 0.5) {
      recommendations.immediate.push('High priority: Crop health is poor - take corrective action');
    }

    healthScore.anomalies.forEach(anomaly => {
      if (anomaly.severity === 'High' || anomaly.severity === 'Critical') {
        recommendations.immediate.push(`Address ${anomaly.type}: ${anomaly.description}`);
      } else if (anomaly.severity === 'Medium') {
        recommendations.shortTerm.push(`Monitor ${anomaly.type}: ${anomaly.description}`);
      }
    });

    // Add general recommendations based on risk level
    if (healthScore.riskLevel === 'High') {
      recommendations.shortTerm.push('Increase monitoring frequency');
      recommendations.shortTerm.push('Consider consulting agricultural expert');
    }

    recommendations.longTerm.push('Implement regular health monitoring system');
    recommendations.longTerm.push('Develop preventive maintenance schedule');
    recommendations.longTerm.push('Consider crop rotation strategy');

    res.json({
      success: true,
      data: {
        recommendations,
        healthScore: healthScore.score,
        riskLevel: healthScore.riskLevel,
        lastUpdated: healthScore.createdAt
      }
    });

  } catch (error) {
    console.error('Get health recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch health recommendations',
      error: error.message
    });
  }
};

module.exports = {
  monitorHealth,
  getHealthScore,
  getAnomalies,
  getHealthHistory,
  setHealthAlert,
  getHealthRecommendations
};
