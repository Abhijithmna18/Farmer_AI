// src/routes/market.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const marketController = require('../controllers/market.controller');

// public or protected? If your dashboard is public, leave unauthenticated.
// If not, uncomment the line below to require auth.
// router.use(authenticateToken);

router.get('/prices', marketController.getPrices);

module.exports = router;
