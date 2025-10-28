// ML Routes - Central routing for all machine learning features
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middlewares/auth.middleware');

// Import ML controllers
const diseaseController = require('../controllers/disease.controller');
const irrigationController = require('../controllers/irrigation.controller');
const pestController = require('../controllers/pest.controller');
const healthController = require('../controllers/health.controller');
const priceController = require('../controllers/price.controller');
const yieldController = require('../controllers/yield.controller');
const fertilizerController = require('../controllers/fertilizer.controller');

// Import ML service
const MLService = require('../services/ml-service');

// ===== DISEASE DETECTION ROUTES =====
router.post('/disease/detect', authenticateToken, diseaseController.uploadImage, diseaseController.detectDisease);
router.get('/disease/history', authenticateToken, diseaseController.getDiseaseHistory);
router.get('/disease/:id', authenticateToken, diseaseController.getDiseaseDetection);
router.get('/disease/treatments/:diseaseType', authenticateToken, diseaseController.getTreatmentRecommendations);
router.get('/disease/stats', authenticateToken, diseaseController.getDiseaseStats);

// ===== IRRIGATION OPTIMIZATION ROUTES =====
router.post('/irrigation/optimize', authenticateToken, irrigationController.optimizeIrrigation);
router.get('/irrigation/schedule/:farmId', authenticateToken, irrigationController.getIrrigationSchedule);
router.put('/irrigation/schedule/:scheduleId', authenticateToken, irrigationController.updateIrrigationSchedule);
router.get('/irrigation/forecast/:farmId', authenticateToken, irrigationController.getWaterUsageForecast);
router.get('/irrigation/history/:farmId', authenticateToken, irrigationController.getIrrigationHistory);
router.post('/irrigation/alert/:farmId', authenticateToken, irrigationController.setIrrigationAlert);

// ===== PEST DETECTION ROUTES =====
router.post('/pest/detect', authenticateToken, pestController.uploadImage, pestController.detectPest);
router.get('/pest/history', authenticateToken, pestController.getPestHistory);
router.get('/pest/:id', authenticateToken, pestController.getPestDetection);
router.get('/pest/treatments/:pestType', authenticateToken, pestController.getTreatmentRecommendations);
router.get('/pest/stats', authenticateToken, pestController.getPestStats);

// ===== HEALTH MONITORING ROUTES =====
router.post('/health/monitor', authenticateToken, healthController.monitorHealth);
router.get('/health/score/:farmId', authenticateToken, healthController.getHealthScore);
router.get('/health/anomalies/:farmId', authenticateToken, healthController.getAnomalies);
router.get('/health/history/:farmId', authenticateToken, healthController.getHealthHistory);
router.post('/health/alert/:farmId', authenticateToken, healthController.setHealthAlert);

// ===== PRICE PREDICTION ROUTES =====
router.get('/price/forecast/:crop', authenticateToken, priceController.getPriceForecast);
router.get('/price/trends', authenticateToken, priceController.getMarketTrends);
router.post('/price/alert', authenticateToken, priceController.setPriceAlert);
router.get('/price/history/:crop', authenticateToken, priceController.getPriceHistory);
router.get('/price/analysis/:crop', authenticateToken, priceController.getPriceAnalysis);

// ===== YIELD PREDICTION ROUTES =====
router.post('/yield/predict', authenticateToken, yieldController.predictYield);
router.get('/yield/history', authenticateToken, yieldController.getYieldHistory);
router.get('/yield/:id', authenticateToken, yieldController.getYieldPrediction);
router.put('/yield/:id/actual', authenticateToken, yieldController.updateActualYield);
router.get('/yield/stats', authenticateToken, yieldController.getYieldStats);
router.get('/yield/recommendations/:farmId', authenticateToken, yieldController.getYieldRecommendations);

// ===== FERTILIZER RECOMMENDATION ROUTES =====
router.post('/fertilizer/recommend', authenticateToken, fertilizerController.getFertilizerRecommendation);
router.get('/fertilizer/history', authenticateToken, fertilizerController.getFertilizerHistory);
router.get('/fertilizer/:id', authenticateToken, fertilizerController.getFertilizerRecommendationById);
router.put('/fertilizer/:id/feedback', authenticateToken, fertilizerController.updateFertilizerFeedback);
router.get('/fertilizer/stats', authenticateToken, fertilizerController.getFertilizerStats);
router.get('/fertilizer/guide/:cropType', authenticateToken, fertilizerController.getCropFertilizerGuide);

// ===== ML SERVICE STATUS ROUTES =====
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const statuses = await MLService.getAllModelsStatus();
    res.json({
      success: true,
      data: statuses
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get ML service status',
      error: error.message
    });
  }
});

router.get('/status/:modelName', authenticateToken, async (req, res) => {
  try {
    const { modelName } = req.params;
    const status = await MLService.getModelStatus(modelName);
    res.json(status);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get model status',
      error: error.message
    });
  }
});

// ===== ML ANALYTICS ROUTES =====
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    
    // Get overview statistics for all ML features
    const overview = {
      diseaseDetections: await require('../models/DiseaseDetection').countDocuments({ userId }),
      irrigationSchedules: await require('../models/IrrigationSchedule').countDocuments({ userId }),
      pestDetections: await require('../models/PestDetection').countDocuments({ userId }),
      healthScores: await require('../models/HealthScore').countDocuments({ userId }),
      priceForecasts: await require('../models/PriceForecast').countDocuments({ userId })
    };

    res.json({
      success: true,
      data: overview
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get ML analytics overview',
      error: error.message
    });
  }
});

// ===== ML RECOMMENDATIONS ROUTES =====
router.get('/recommendations/:farmId', authenticateToken, async (req, res) => {
  try {
    const { farmId } = req.params;
    const userId = req.user.id || req.user._id;
    
    // Get personalized recommendations based on farm data
    const recommendations = {
      irrigation: await irrigationController.getIrrigationSchedule(req, res),
      health: await healthController.getHealthScore(req, res),
      pests: await pestController.getPestStats(req, res),
      diseases: await diseaseController.getDiseaseStats(req, res)
    };

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get ML recommendations',
      error: error.message
    });
  }
});

// ===== ML DATA EXPORT ROUTES =====
router.get('/export/:type', authenticateToken, async (req, res) => {
  try {
    const { type } = req.params;
    const userId = req.user.id || req.user._id;
    const { format = 'json', startDate, endDate } = req.query;

    let data = [];
    let filename = '';

    switch (type) {
      case 'disease':
        data = await require('../models/DiseaseDetection').find({ userId });
        filename = 'disease_detections';
        break;
      case 'irrigation':
        data = await require('../models/IrrigationSchedule').find({ userId });
        filename = 'irrigation_schedules';
        break;
      case 'pest':
        data = await require('../models/PestDetection').find({ userId });
        filename = 'pest_detections';
        break;
      case 'health':
        data = await require('../models/HealthScore').find({ userId });
        filename = 'health_scores';
        break;
      case 'price':
        data = await require('../models/PriceForecast').find({ userId });
        filename = 'price_forecasts';
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid export type'
        });
    }

    if (format === 'csv') {
      // Convert to CSV format
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: data,
        filename: filename
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to export ML data',
      error: error.message
    });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0].toObject());
  const csvContent = [
    headers.join(','),
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        return typeof value === 'string' ? `"${value}"` : value;
      }).join(',')
    )
  ].join('\n');
  
  return csvContent;
}

module.exports = router;
