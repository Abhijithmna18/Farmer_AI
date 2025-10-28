// Fertilizer Recommendation Controller
const MLService = require('../services/ml-service');
const FertilizerRecommendation = require('../models/FertilizerRecommendation');

// Get fertilizer recommendation using decision tree classification
const getFertilizerRecommendation = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const {
      farmId,
      cropType,
      nitrogen,
      phosphorus,
      potassium,
      ph,
      organicMatter,
      soilType,
      previousCrop,
      plantingDate,
      budget
    } = req.body;

    // Validate required fields
    if (!farmId || !cropType || !nitrogen || !phosphorus || !potassium || !ph) {
      return res.status(400).json({
        success: false,
        message: 'Farm ID, crop type, and soil analysis data are required'
      });
    }

    // Prepare soil analysis data
    const soilAnalysis = {
      nitrogen: parseFloat(nitrogen),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium),
      ph: parseFloat(ph),
      organicMatter: parseFloat(organicMatter) || 2.0, // Default value
      soilType: soilType || 'loamy'
    };

    // Call ML service for fertilizer recommendation
    const mlResult = await MLService.recommendFertilizer({
      cropType,
      soilAnalysis,
      previousCrop: previousCrop || 'none',
      plantingDate: new Date(plantingDate),
      budget: parseFloat(budget) || 1000
    });

    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Fertilizer recommendation failed',
        error: mlResult.error
      });
    }

    const { recommendations, decisionTreePath, confidence, totalCost, applicationSchedule } = mlResult.data;

    // Save recommendation to database
    const fertilizerRecommendation = new FertilizerRecommendation({
      userId,
      farmId,
      cropType,
      soilAnalysis,
      recommendations,
      decisionTreePath,
      confidence,
      totalCost,
      currency: 'INR',
      applicationSchedule: applicationSchedule || [],
      soilTestDate: new Date(),
      recommendationDate: new Date()
    });

    await fertilizerRecommendation.save();

    // Log the operation
    await MLService.logMLOperation(
      'fertilizer_recommendation',
      'fertilizer-recommendation',
      userId,
      { farmId, cropType, soilAnalysis },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        recommendationId: fertilizerRecommendation._id,
        cropType,
        recommendations: fertilizerRecommendation.recommendations,
        decisionTreePath: fertilizerRecommendation.decisionTreePath,
        confidence: fertilizerRecommendation.confidence,
        totalCost: fertilizerRecommendation.totalCost,
        applicationSchedule: fertilizerRecommendation.applicationSchedule,
        summary: fertilizerRecommendation.getSummary(),
        recommendationDate: fertilizerRecommendation.recommendationDate
      }
    });

  } catch (error) {
    console.error('Fertilizer recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during fertilizer recommendation',
      error: error.message
    });
  }
};

// Get fertilizer recommendation history
const getFertilizerHistory = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { page = 1, limit = 10, farmId, cropType } = req.query;
    
    const query = { userId };
    if (farmId) query.farmId = farmId;
    if (cropType) query.cropType = new RegExp(cropType, 'i');

    const recommendations = await FertilizerRecommendation.find(query)
      .sort({ recommendationDate: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('farmId', 'name location')
      .select('-__v');

    const total = await FertilizerRecommendation.countDocuments(query);

    res.json({
      success: true,
      data: {
        recommendations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get fertilizer history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fertilizer recommendation history',
      error: error.message
    });
  }
};

// Get specific fertilizer recommendation by ID
const getFertilizerRecommendationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    const recommendation = await FertilizerRecommendation.findOne({
      _id: id,
      userId
    }).populate('farmId', 'name location');

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer recommendation not found'
      });
    }

    res.json({
      success: true,
      data: recommendation
    });

  } catch (error) {
    console.error('Get fertilizer recommendation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fertilizer recommendation',
      error: error.message
    });
  }
};

// Update fertilizer application feedback
const updateFertilizerFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { applied, actualAmount, actualDate, effectiveness, notes } = req.body;
    const userId = req.user.id || req.user._id;

    const recommendation = await FertilizerRecommendation.findOne({
      _id: id,
      userId
    });

    if (!recommendation) {
      return res.status(404).json({
        success: false,
        message: 'Fertilizer recommendation not found'
      });
    }

    // Update feedback
    recommendation.feedback = {
      applied: applied || false,
      actualAmount: actualAmount ? parseFloat(actualAmount) : null,
      actualDate: actualDate ? new Date(actualDate) : null,
      effectiveness: effectiveness || null,
      notes: notes || null
    };

    recommendation.status = applied ? 'completed' : 'in_progress';
    await recommendation.save();

    res.json({
      success: true,
      data: {
        recommendationId: recommendation._id,
        feedback: recommendation.feedback,
        status: recommendation.status,
        updatedAt: recommendation.updatedAt
      }
    });

  } catch (error) {
    console.error('Update fertilizer feedback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fertilizer feedback',
      error: error.message
    });
  }
};

// Get fertilizer statistics and trends
const getFertilizerStats = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { farmId, period = '90' } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const matchQuery = {
      userId,
      recommendationDate: { $gte: startDate }
    };
    if (farmId) matchQuery.farmId = farmId;

    // Get basic statistics
    const stats = await FertilizerRecommendation.aggregate([
      {
        $match: matchQuery
      },
      {
        $group: {
          _id: '$cropType',
          count: { $sum: 1 },
          avgConfidence: { $avg: '$confidence' },
          avgTotalCost: { $avg: '$totalCost' },
          totalCost: { $sum: '$totalCost' },
          appliedCount: {
            $sum: { $cond: [{ $eq: ['$feedback.applied', true] }, 1, 0] }
          }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Get fertilizer usage trends
    const trends = await FertilizerRecommendation.getFertilizerTrends(farmId, parseInt(period));

    const totalRecommendations = await FertilizerRecommendation.countDocuments(matchQuery);

    res.json({
      success: true,
      data: {
        stats,
        trends,
        totalRecommendations,
        period: `${period} days`
      }
    });

  } catch (error) {
    console.error('Get fertilizer stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fertilizer statistics',
      error: error.message
    });
  }
};

// Get fertilizer recommendations by crop type
const getCropFertilizerGuide = async (req, res) => {
  try {
    const { cropType } = req.params;
    const userId = req.user.id || req.user._id;

    // Get recent recommendations for this crop type
    const recentRecommendations = await FertilizerRecommendation.find({
      userId,
      cropType: new RegExp(cropType, 'i')
    })
    .sort({ recommendationDate: -1 })
    .limit(10)
    .select('recommendations soilAnalysis totalCost recommendationDate');

    if (recentRecommendations.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No fertilizer recommendations found for this crop type'
      });
    }

    // Analyze common patterns
    const fertilizerTypes = {};
    const applicationMethods = {};
    const timingPatterns = {};

    recentRecommendations.forEach(rec => {
      rec.recommendations.forEach(fertilizer => {
        // Count fertilizer types
        fertilizerTypes[fertilizer.fertilizerType] = 
          (fertilizerTypes[fertilizer.fertilizerType] || 0) + 1;
        
        // Count application methods
        applicationMethods[fertilizer.applicationMethod] = 
          (applicationMethods[fertilizer.applicationMethod] || 0) + 1;
        
        // Count timing patterns
        timingPatterns[fertilizer.timing] = 
          (timingPatterns[fertilizer.timing] || 0) + 1;
      });
    });

    // Calculate average costs
    const avgCost = recentRecommendations.reduce((sum, rec) => sum + rec.totalCost, 0) / recentRecommendations.length;

    res.json({
      success: true,
      data: {
        cropType,
        totalRecommendations: recentRecommendations.length,
        commonFertilizers: Object.entries(fertilizerTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5),
        commonMethods: Object.entries(applicationMethods)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3),
        commonTiming: Object.entries(timingPatterns)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3),
        averageCost: Math.round(avgCost * 100) / 100,
        lastUpdated: recentRecommendations[0].recommendationDate
      }
    });

  } catch (error) {
    console.error('Get crop fertilizer guide error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch crop fertilizer guide',
      error: error.message
    });
  }
};

module.exports = {
  getFertilizerRecommendation,
  getFertilizerRecommendationById,
  getFertilizerHistory,
  updateFertilizerFeedback,
  getFertilizerStats,
  getCropFertilizerGuide
};
