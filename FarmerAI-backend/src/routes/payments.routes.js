// src/routes/payments.routes.js
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth.middleware');
const razorpayController = require('../controllers/razorpay.controller');
const bookingController = require('../controllers/booking.controller');

// All payment routes require authentication
router.use(authenticateToken);

// Proxy: create Razorpay order (expects amount in smallest currency unit)
router.post('/create-order', razorpayController.createRazorpayOrder);

// Proxy: verify payment signature and finalize booking
router.post('/verify', bookingController.verifyPayment);

module.exports = router;
