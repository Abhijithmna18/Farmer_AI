// src/routes/razorpay.routes.js
// Razorpay API routes

const express = require('express');
const router = express.Router();
const razorpayController = require('../controllers/razorpay-example.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Create Razorpay order for booking
router.post('/create-order', razorpayController.createBookingOrder);

// Verify payment after successful payment
router.post('/verify-payment', razorpayController.verifyBookingPayment);

// Process refund
router.post('/refund', razorpayController.processRefund);

// Get payment status
router.get('/payment-status/:paymentId', razorpayController.getPaymentStatus);

// Razorpay webhook (no authentication required)
router.post('/webhook', razorpayController.handleRazorpayWebhook);

module.exports = router;










