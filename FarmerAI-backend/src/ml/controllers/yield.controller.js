// Yield Prediction Controller
const MLService = require('../services/ml-service');
const YieldPrediction = require('../models/YieldPrediction');
const SensorData = require('../../models/SensorData');

// Predict crop yield using ANN regression
const predictYield = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      farmId,
      cropType,
      nitrogen,
      phosphorus,
      potassium,
      temperature,
      humidity,
      ph,
      rainfall,
      soilType,
      irrigationMethod,
      plantingDate,
      expectedHarvestDate
    } = req.body;

    // Validate required fields
    if (!farmId || !cropType || !nitrogen || !phosphorus || !potassium || 
        !temperature || !humidity || !ph || !rainfall) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided for yield prediction'
      });
    }

    // Get recent sensor data for additional context
    const sensorData = await SensorData.find({ farmId })
      .sort({ timestamp: -1 })
      .limit(24) // Last 24 readings
      .select('temperature humidity soilMoisture lightIntensity timestamp');

    // Prepare input features for ML model
    const inputFeatures = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      temperature: parseFloat(temperature),
      humidity: parseFloat(humidity),
      ph: parseFloat(ph),
      rainfall: parseFloat(rainfall),
      soilType: soilType || 'loamy',
      irrigationMethod: irrigationMethod || 'drip',
      plantingDate: new Date(plantingDate),
      expectedHarvestDate: new Date(expectedHarvestDate)
    };

    // Call ML service for yield prediction
    const mlResult = await MLService.predictYield(inputFeatures, sensorData);

    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Yield prediction failed',
        error: mlResult.error
      });
    }

    const { predictedYield, confidence, recommendations } = mlResult.data;

    // Save prediction to database
    const yieldPrediction = new YieldPrediction({
      userId,
      farmId,
      cropType,
      predictedYield,
      confidence,
      inputFeatures,
      recommendations: recommendations || [],
      modelVersion: '1.0.0',
      predictionDate: new Date()
    });

    await yieldPrediction.save();

    // Log the operation
    await MLService.logMLOperation(
      'yield_prediction',
      'yield-prediction',
      userId,
      { farmId, cropType, inputFeatures },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        predictionId: yieldPrediction._id,
        cropType,
        predictedYield,
        confidence,
        recommendations: yieldPrediction.recommendations,
        inputFeatures: yieldPrediction.inputFeatures,
        predictionDate: yieldPrediction.predictionDate,
        modelVersion: yieldPrediction.modelVersion
      }
    });

  } catch (error) {
    console.error('Yield prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during yield prediction',
      error: error.message
    });
  }
};

// Get yield prediction history
const getYieldHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10, farmId, cropType } = req.query;
    
    const query = { userId };
    if (farmId) query.farmId = farmId;
    if (cropType) query.cropType = new RegExp(cropType, 'i');

    const predictions = await YieldPrediction.find(query)
      .sort({ predictionDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('farmId', 'name location')
      .select('-__v');

    const total = await YieldPrediction.countDocuments(query);

    res.json({
      success: true,
      data: {
        predictions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get yield history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield prediction history',
      error: error.message
    });
  }
};

// Get specific yield prediction by ID
const getYieldPrediction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const prediction = await YieldPrediction.findOne({
      _id: id,
      userId
    }).populate('farmId', 'name location');

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Yield prediction not found'
      });
    }

    res.json({
      success: true,
      data: prediction
    });

  } catch (error) {
    console.error('Get yield prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield prediction',
      error: error.message
    });
  }
};

// Update actual yield and calculate accuracy
const updateActualYield = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualYield } = req.body;
    const userId = req.user.id || req.user._id;

    if (!actualYield || actualYield <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid actual yield is required'
      });
    }

    const prediction = await YieldPrediction.findOne({
      _id: id,
      userId
    });

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: 'Yield prediction not found'
      });
    }

    // Calculate accuracy
    const accuracy = prediction.calculateAccuracy(parseFloat(actualYield));
    await prediction.save();

    res.json({
      success: true,
      data: {
        predictionId: prediction._id,
        predictedYield: prediction.predictedYield,
        actualYield: prediction.actualYield,
        accuracy: prediction.accuracy,
        updatedAt: prediction.updatedAt
      }
    });

  } catch (error) {
    console.error('Update actual yield error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update actual yield',
      error: error.message
    });
  }
};

// Get yield statistics and trends
const getYieldStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { farmId, cropType, period = '30' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const matchQuery = {
      userId,
      predictionDate: { $gte: startDate }
    };
    if (farmId) matchQuery.farmId = farmId;
    if (cropType) matchQuery.cropType = new RegExp(cropType, 'i');

    // Get basic statistics
    const stats = await YieldPrediction.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$cropType',
          count: { $sum: 1 },
          avgPredictedYield: { $avg: '$predictedYield' },
          avgConfidence: { $avg: '$confidence' },
          avgActualYield: { $avg: '$actualYield' },
          avgAccuracy: { $avg: '$accuracy' }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get yield trends
    const trends = {};
    for (const stat of stats) {
      const trend = await YieldPrediction.getYieldTrend(farmId, stat._id, parseInt(period));
      trends[stat._id] = trend;
    }

    const totalPredictions = await YieldPrediction.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        stats,
        trends,
        totalPredictions,
        period: `${period} days`
      }
    });

  } catch (error) {
    console.error('Get yield stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield statistics',
      error: error.message
    });
  }
};

// Get yield recommendations
const getYieldRecommendations = async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;

    const recentPrediction = await YieldPrediction.findOne({
      farmId,
      userId,
      status: 'active'
    }).sort({ predictionDate: -1 });

    if (!recentPrediction) {
      return res.status(404).json({
        success: false,
        message: 'No recent yield prediction found for this farm'
      });
    }

    const recommendations = {
      immediate: [],
      shortTerm: [],
      longTerm: []
    };

    // Categorize recommendations by priority
    recentPrediction.recommendations.forEach(rec => {
      if (rec.priority === 'critical' || rec.priority === 'high') {
        recommendations.immediate.push(rec);
      } else if (rec.priority === 'medium') {
        recommendations.shortTerm.push(rec);
      } else {
        recommendations.longTerm.push(rec);
      }
    });

    // Add general recommendations based on predicted yield
    if (recentPrediction.predictedYield < 1000) { // Low yield threshold
      recommendations.immediate.push({
        type: 'fertilizer',
        priority: 'high',
        message: 'Consider increasing fertilizer application to improve yield',
        expectedImpact: 'Potential 15-25% yield increase'
      });
    }

    if (recentPrediction.confidence < 70) {
      recommendations.shortTerm.push({
        type: 'monitoring',
        priority: 'medium',
        message: 'Increase data collection for more accurate predictions',
        expectedImpact: 'Improved prediction accuracy'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        predictedYield: recentPrediction.predictedYield,
        confidence: recentPrediction.confidence,
        cropType: recentPrediction.cropType,
        predictionDate: recentPrediction.predictionDate
      }
    });

  } catch (error) {
    console.error('Get yield recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yield recommendations',
      error: error.message
    });
  }
};

module.exports = {
  predictYield,
  getYieldHistory,
  getYieldPrediction,
  updateActualYield,
  getYieldStats,
  getYieldRecommendations
};
