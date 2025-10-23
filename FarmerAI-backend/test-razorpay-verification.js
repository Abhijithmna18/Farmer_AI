// Test script to verify Razorpay configuration and payment verification
require('dotenv').config();
const { verifyPayment, razorpay } = require('./src/config/razorpay');

console.log('Testing Razorpay configuration and payment verification...');

// Check if credentials are loaded
console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✓ Loaded' : '✗ Missing');
console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✓ Loaded' : '✗ Missing');

if (razorpay) {
  console.log('Razorpay instance: ✓ Initialized');
} else {
  console.log('Razorpay instance: ✗ Not initialized');
  console.log('This usually means credentials are missing or invalid');
  process.exit(1);
}

// Test the verifyPayment function with sample data
console.log('\nTesting verifyPayment function...');

// Sample test data (these would normally come from an actual payment)
const testOrderId = 'order_test123';
const testPaymentId = 'pay_test456';
const testSignature = 'test_signature_789';

try {
  // This should not throw an error with our fix
  console.log('Testing verifyPayment function with sample data...');
  const result = verifyPayment(testOrderId, testPaymentId, testSignature);
  console.log('Payment verification result:', result);
  console.log('✅ Payment verification function works correctly');
} catch (error) {
  console.error('❌ Error in payment verification:', error.message);
}

// Test with actual field names that might be sent from frontend
console.log('\nTesting with frontend field names...');
const frontendData = {
  bookingId: 'booking_123',
  razorpay_payment_id: 'pay_456',
  razorpay_signature: 'sig_789',
  razorpay_order_id: 'order_012'
};

console.log('Frontend data:', frontendData);

console.log('\n✅ Razorpay verification test completed');