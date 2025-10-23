// src/routes/test-razorpay.routes.js
// Test routes for Razorpay integration

const express = require('express');
const router = express.Router();
const { createOrder, verifyPayment } = require('../config/razorpay');

// Test Razorpay credentials
router.get('/test-credentials', (req, res) => {
  const hasKeyId = !!process.env.RAZORPAY_KEY_ID;
  const hasKeySecret = !!process.env.RAZORPAY_KEY_SECRET;
  const hasWebhookSecret = !!process.env.RAZORPAY_WEBHOOK_SECRET;

  res.json({
    success: true,
    message: 'Razorpay credentials check',
    credentials: {
      keyId: hasKeyId ? '✅ Set' : '❌ Missing',
      keySecret: hasKeySecret ? '✅ Set' : '❌ Missing',
      webhookSecret: hasWebhookSecret ? '✅ Set' : '❌ Missing'
    },
    status: hasKeyId && hasKeySecret ? 'Ready' : 'Not Ready'
  });
});

// Test order creation
router.post('/test-order', async (req, res) => {
  try {
    const { amount = 1000, currency = 'INR' } = req.body;
    
    const order = await createOrder(amount, currency, `test_${Date.now()}`);
    
    res.json({
      success: true,
      message: 'Test order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create test order',
      error: error.message
    });
  }
});

// Test payment verification (with dummy data)
router.post('/test-verification', (req, res) => {
  try {
    const { orderId, paymentId, signature } = req.body;
    
    // This will return false with dummy data, which is expected
    const isValid = verifyPayment(orderId, paymentId, signature);
    
    res.json({
      success: true,
      message: 'Payment verification test completed',
      data: {
        isValid: isValid,
        note: 'This will be false with test data, which is expected'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Payment verification test failed',
      error: error.message
    });
  }
});

module.exports = router;

























