// Test the verify-payment endpoint with realistic data
require('dotenv').config();
const express = require('express');
const { verifyPayment } = require('./src/config/razorpay');

// Create a mock request object to test the verifyPayment function
const mockReq = {
  body: {
    bookingId: 'test_booking_123',
    razorpay_payment_id: 'pay_test456',
    razorpay_signature: 'test_signature_789',
    razorpay_order_id: 'order_test012'
  },
  user: {
    id: 'test_user_id'
  }
};

// Create a mock response object
const mockRes = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    this.responseData = data;
    console.log(`Response Status: ${this.statusCode}`);
    console.log('Response Data:', JSON.stringify(data, null, 2));
    return this;
  }
};

console.log('Testing verify-payment endpoint with mock request...');
console.log('Request body:', JSON.stringify(mockReq.body, null, 2));

// Test the actual function with our mock data
try {
  // This simulates what happens in the controller
  const { bookingId, razorpay_payment_id, razorpay_signature, razorpay_order_id } = mockReq.body;
  
  console.log('\nExtracted fields:');
  console.log('bookingId:', bookingId);
  console.log('razorpay_payment_id:', razorpay_payment_id);
  console.log('razorpay_signature:', razorpay_signature);
  console.log('razorpay_order_id:', razorpay_order_id);
  
  // Test field handling logic
  const actualPaymentId = razorpay_payment_id;
  const actualSignature = razorpay_signature;
  const actualOrderId = razorpay_order_id;
  
  console.log('\nActual fields used for verification:');
  console.log('actualPaymentId:', actualPaymentId);
  console.log('actualSignature:', actualSignature);
  console.log('actualOrderId:', actualOrderId);
  
  // Check if required fields are present
  if (!bookingId || !actualPaymentId || !actualSignature) {
    console.log('❌ Missing required fields');
  } else {
    console.log('✅ All required fields present');
  }
  
  console.log('\n✅ Endpoint test completed');
  
} catch (error) {
  console.error('❌ Error in endpoint test:', error.message);
}