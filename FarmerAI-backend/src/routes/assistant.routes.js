const express = require('express');
const { authenticateToken } = require('../middlewares/auth.middleware.js');
const assistantController = require('../controllers/assistant.controller.js');

const router = express.Router();

// Assistant feature routes
router.post('/recommend', authenticateToken, assistantController.getRecommendations);
router.post('/select', authenticateToken, assistantController.selectCrop);
router.get('/guide', authenticateToken, assistantController.getCultivationGuide);
router.get('/interactions', authenticateToken, assistantController.getInteractions);
// New Gemini endpoints
router.post('/ask', authenticateToken, assistantController.ask);
router.get('/history/:userId', authenticateToken, assistantController.history);
router.get('/insights', authenticateToken, assistantController.insights);

// Advisor actions
router.post('/tasks/complete', authenticateToken, assistantController.completeTask);
router.post('/tasks/custom', authenticateToken, assistantController.addCustomTask);
router.post('/alerts/price', authenticateToken, assistantController.setPriceAlert);

module.exports = router;