// Test script for payment confirmation functionality
// Run with: node test-payment-confirmation.js

require('dotenv').config();
const mongoose = require('mongoose');
const { sendPaymentConfirmation } = require('./FarmerAI-backend/src/services/email.service');

async function testPaymentConfirmation() {
  console.log('Testing payment confirmation email...');
  
  try {
    // Test sending payment confirmation email
    await sendPaymentConfirmation('test@example.com', {
      farmerName: 'Test User',
      bookingId: 'SUBTEST123',
      paymentId: 'pay_TEST123',
      amount: 499,
      paymentMethod: 'Razorpay',
      paymentDate: new Date().toLocaleDateString(),
      warehouseName: 'Monthly Workshop Subscription',
      startDate: new Date().toLocaleDateString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
    });
    
    console.log('✅ Payment confirmation email sent successfully');
  } catch (error) {
    console.error('❌ Failed to send payment confirmation email:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testPaymentConfirmation();
}

module.exports = { testPaymentConfirmation };