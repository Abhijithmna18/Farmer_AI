// src/routes/razorpay.routes.js
const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  getRazorpayOrderDetails
} = require('../controllers/razorpay.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create Razorpay order
router.post('/create-order', createRazorpayOrder);

// Get order details
router.get('/order/:orderId', getRazorpayOrderDetails);

module.exports = router;