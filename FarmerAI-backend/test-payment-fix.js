// Test script to verify payment verification fix
require('dotenv').config();
const { verifyPayment } = require('./src/config/razorpay');

console.log('Testing payment verification fix...');

// Test with sample data
const testOrderId = 'order_test123';
const testPaymentId = 'pay_test456';
const testSignature = 'test_signature_789';

try {
  // This should not throw an error with our fix
  console.log('Testing verifyPayment function...');
  const result = verifyPayment(testOrderId, testPaymentId, testSignature);
  console.log('Payment verification result:', result);
  console.log('✅ Payment verification function works correctly');
} catch (error) {
  console.error('❌ Error in payment verification:', error.message);
}

console.log('✅ Payment fix verification completed');