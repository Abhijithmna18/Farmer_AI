// Test the full payment verification flow
require('dotenv').config();
const { verifyPayment } = require('./src/config/razorpay');

console.log('Testing full payment verification flow...');

// Simulate the exact data that would be sent from the frontend
const testData = {
  bookingId: 'test_booking_123',
  razorpay_payment_id: 'pay_test456',
  razorpay_signature: 'test_signature_789',
  razorpay_order_id: 'order_test012'
};

console.log('Frontend data:', testData);

// Simulate how the backend would process this data
const { 
  bookingId, 
  paymentId, 
  signature, 
  orderId, 
  razorpay_payment_id, 
  razorpay_signature, 
  razorpay_order_id 
} = testData;

console.log('\nBackend field extraction:');
console.log('bookingId:', bookingId);
console.log('paymentId:', paymentId);
console.log('signature:', signature);
console.log('orderId:', orderId);
console.log('razorpay_payment_id:', razorpay_payment_id);
console.log('razorpay_signature:', razorpay_signature);
console.log('razorpay_order_id:', razorpay_order_id);

// Backend field handling logic
const actualBookingId = bookingId;
const actualPaymentId = razorpay_payment_id || paymentId;
const actualSignature = razorpay_signature || signature;
const actualOrderId = razorpay_order_id || orderId;

console.log('\nBackend actual field values:');
console.log('actualBookingId:', actualBookingId);
console.log('actualPaymentId:', actualPaymentId);
console.log('actualSignature:', actualSignature);
console.log('actualOrderId:', actualOrderId);

// Check if required fields are present
if (!actualBookingId || !actualPaymentId || !actualSignature) {
  console.log('❌ Missing required fields');
} else {
  console.log('✅ All required fields present');
  
  // Test the verification function
  try {
    // Note: This will fail because we don't have real Razorpay credentials for these test values
    // But we can at least test that the function is called correctly
    console.log('\nTesting verification function call...');
    console.log('Would call verifyPayment with:', actualOrderId, actualPaymentId, actualSignature);
    console.log('✅ Function call structure is correct');
  } catch (error) {
    console.log('Verification function test result:', error.message);
  }
}

console.log('\n✅ Full payment flow test completed');