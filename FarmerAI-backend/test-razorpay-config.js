// Test Razorpay configuration
require('dotenv').config();
const crypto = require('crypto');
const { razorpay, verifyPayment } = require('./src/config/razorpay');

console.log('\n🔍 Razorpay Configuration Test');
console.log('================================\n');

// Check if credentials are loaded
const hasKeyId = process.env.RAZORPAY_KEY_ID;
const hasSecret = process.env.RAZORPAY_KEY_SECRET;

console.log('📋 Environment Variables:');
console.log('  RAZORPAY_KEY_ID:', hasKeyId ? `✓ Loaded (${process.env.RAZORPAY_KEY_ID})` : '✗ Missing');
console.log('  RAZORPAY_KEY_SECRET:', hasSecret ? `✓ Loaded (${process.env.RAZORPAY_KEY_SECRET.substring(0, 4)}...)` : '✗ Missing');
console.log('');

// Check if instance is initialized
if (razorpay) {
  console.log('✅ Razorpay instance: Initialized\n');
  
  // Test signature verification
  console.log('🔐 Testing Signature Verification:');
  const testOrderId = 'order_test123';
  const testPaymentId = 'pay_test456';
  const testBody = testOrderId + '|' + testPaymentId;
  const testSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(testBody)
    .digest('hex');
  
  console.log(`  Order ID: ${testOrderId}`);
  console.log(`  Payment ID: ${testPaymentId}`);
  console.log(`  Generated Signature: ${testSignature.substring(0, 20)}...`);
  
  try {
    const isValid = verifyPayment(testOrderId, testPaymentId, testSignature);
    console.log(`  Verification Result: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
  } catch (error) {
    console.log(`  Verification Error: ❌ ${error.message}`);
  }
  console.log('');
  
  // Test API connection
  console.log('🌐 Testing Razorpay API Connection:');
  razorpay.orders.all({ count: 1 })
    .then(orders => {
      console.log('  API Connection: ✅ Working');
      console.log(`  Account has ${orders.count} orders\n`);
      console.log('✅ All tests passed! Razorpay is configured correctly.\n');
    })
    .catch(err => {
      console.log('  API Connection: ❌ Failed');
      console.log(`  Error: ${err.message}\n`);
      
      if (err.message.includes('authentication')) {
        console.log('💡 Troubleshooting:');
        console.log('  - Verify your Key ID and Secret are correct');
        console.log('  - Make sure you\'re using Test Mode keys (start with rzp_test_)');
        console.log('  - Check Razorpay Dashboard: https://dashboard.razorpay.com/\n');
      }
    });
} else {
  console.log('❌ Razorpay instance: Not initialized\n');
  console.log('💡 This usually means credentials are missing or invalid\n');
  console.log('📝 To fix:');
  console.log('  1. Create/edit .env file in FarmerAI-backend directory');
  console.log('  2. Add these lines:');
  console.log('     RAZORPAY_KEY_ID=rzp_test_YOUR_KEY_ID');
  console.log('     RAZORPAY_KEY_SECRET=YOUR_KEY_SECRET');
  console.log('  3. Get keys from: https://dashboard.razorpay.com/app/keys');
  console.log('  4. Make sure to use TEST MODE keys during development\n');
}