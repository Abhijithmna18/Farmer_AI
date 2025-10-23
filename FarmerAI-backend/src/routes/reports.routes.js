// src/routes/reports.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const controller = require('../controllers/reports.controller');

router.use(authenticateToken);
router.get('/soil/:userId?', controller.getSoilHistory);
router.get('/crops/:userId?', controller.getCropsReport);
router.get('/market/:crop', controller.getMarketTrends);
router.get('/export/:format', controller.exportData);

module.exports = router;















