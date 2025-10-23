// src/routes/farm-monitoring.routes.js
const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/farm-monitoring.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/farm-monitoring/fetch
 * @desc    Fetch sensor data from Adafruit IO and save to database
 * @access  Private
 */
router.post('/fetch', fetchAndStoreSensorData);

/**
 * @route   GET /api/farm-monitoring/latest
 * @desc    Get latest sensor reading
 * @access  Private
 */
router.get('/latest', getLatestReading);

/**
 * @route   GET /api/farm-monitoring/history
 * @desc    Get historical sensor data
 * @query   hours - Number of hours to fetch (default: 24, max: 168)
 * @query   limit - Number of data points to return (default: 100)
 * @access  Private
 */
router.get('/history', getHistoricalData);

/**
 * @route   GET /api/farm-monitoring/stats
 * @desc    Get sensor statistics (min, max, avg)
 * @query   hours - Number of hours to analyze (default: 24, max: 168)
 * @access  Private
 */
router.get('/stats', getSensorStats);

/**
 * @route   POST /api/farm-monitoring/add
 * @desc    Manually add sensor data (for testing)
 * @access  Private
 */
router.post('/add', addSensorData);

/**
 * @route   DELETE /api/farm-monitoring/cleanup
 * @desc    Delete old sensor data
 * @query   days - Delete data older than this many days (default: 30)
 * @access  Private (Admin only recommended)
 */
router.delete('/cleanup', cleanupOldData);

/**
 * @route   GET /api/farm-monitoring/export
 * @desc    Export sensor data as CSV
 * @query   hours - Number of hours to export (default: 24)
 * @access  Private
 */
router.get('/export', exportSensorDataCSV);

/**
 * @route   GET /api/farm-monitoring/analytics
 * @desc    Get predictive analytics for crop conditions
 * @query   hours - Number of hours to analyze (default: 24)
 * @access  Private
 */
router.get('/analytics', getPredictiveAnalytics);

/**
 * @route   GET /api/farm-monitoring/alerts
 * @desc    Get alert conditions based on current sensor data
 * @access  Private
 */
router.get('/alerts', getAlerts);

/**
 * @route   POST /api/farm-monitoring/alerts
 * @desc    Create a custom alert
 * @access  Private
 */
router.post('/alerts', createCustomAlert);

/**
 * @route   GET /api/farm-monitoring/alerts/custom
 * @desc    Get all custom alerts
 * @access  Private
 */
router.get('/alerts/custom', getCustomAlerts);

module.exports = router;