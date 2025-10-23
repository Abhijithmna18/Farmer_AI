// Detailed test for payment verification
require('dotenv').config();
const crypto = require('crypto');
const { verifyPayment } = require('./src/config/razorpay');

console.log('Detailed payment verification test...');

// Test with actual Razorpay signature verification logic
const keySecret = process.env.RAZORPAY_KEY_SECRET;
console.log('Key Secret loaded:', keySecret ? 'Yes' : 'No');

if (!keySecret) {
  console.error('❌ RAZORPAY_KEY_SECRET not found in environment variables');
  process.exit(1);
}

// Test data that simulates a real Razorpay payment
const orderId = 'order_Jhf1LnTuyEz3N1';
const paymentId = 'pay_Jhf1LnTuyEz3N1';
const body = orderId + '|' + paymentId;

console.log('\nTest data:');
console.log('Order ID:', orderId);
console.log('Payment ID:', paymentId);
console.log('Body for signature:', body);

// Generate a valid signature using the same method Razorpay uses
const expectedSignature = crypto
  .createHmac('sha256', keySecret)
  .update(body)
  .digest('hex');

console.log('Generated signature:', expectedSignature);

// Test our verification function
try {
  const result = verifyPayment(orderId, paymentId, expectedSignature);
  console.log('\nVerification result:', result);
  
  if (result) {
    console.log('✅ Signature verification passed');
  } else {
    console.log('❌ Signature verification failed');
  }
} catch (error) {
  console.error('❌ Error during verification:', error.message);
}

// Test with invalid signature
console.log('\nTesting with invalid signature...');
const invalidResult = verifyPayment(orderId, paymentId, 'invalid_signature');
console.log('Invalid signature test result:', invalidResult);

console.log('\n✅ Detailed payment verification test completed');