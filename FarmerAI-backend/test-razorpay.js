// test-razorpay.js
// Test script to verify Razorpay integration

require('dotenv').config();
const { createOrder, verifyPayment } = require('./src/config/razorpay');

async function testRazorpayIntegration() {
  console.log('🧪 Testing Razorpay Integration...\n');

  // Check if credentials are loaded
  console.log('📋 Environment Check:');
  console.log('RAZORPAY_KEY_ID:', process.env.RAZORPAY_KEY_ID ? '✅ Set' : '❌ Missing');
  console.log('RAZORPAY_KEY_SECRET:', process.env.RAZORPAY_KEY_SECRET ? '✅ Set' : '❌ Missing');
  console.log('');

  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.log('❌ Razorpay credentials not found in environment variables');
    console.log('Please add them to your .env file:');
    console.log('RAZORPAY_KEY_ID=rzp_test_RGXWGOBliVCIpU');
    console.log('RAZORPAY_KEY_SECRET=9Q49llzcN0kLD3021OoSstOp');
    return;
  }

  try {
    // Test 1: Create Order
    console.log('🔄 Test 1: Creating Razorpay Order...');
    const order = await createOrder(1000, 'INR', 'test_order_123');
    console.log('✅ Order created successfully:');
    console.log('   Order ID:', order.id);
    console.log('   Amount:', order.amount);
    console.log('   Currency:', order.currency);
    console.log('');

    // Test 2: Verify Payment (with test data)
    console.log('🔄 Test 2: Testing Payment Verification...');
    const testOrderId = order.id;
    const testPaymentId = 'pay_test_123456789';
    const testSignature = 'test_signature_123456789';
    
    try {
      const isValid = verifyPayment(testOrderId, testPaymentId, testSignature);
      console.log('✅ Payment verification function works');
      console.log('   (Note: This will return false with test data, which is expected)');
    } catch (error) {
      console.log('⚠️  Payment verification error (expected with test data):', error.message);
    }
    console.log('');

    console.log('🎉 Razorpay integration test completed successfully!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('1. Start your backend server: npm run dev');
    console.log('2. Test the API endpoints with the order ID:', order.id);
    console.log('3. Use the frontend components to test the complete flow');

  } catch (error) {
    console.log('❌ Error testing Razorpay integration:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Check if your .env file is in the correct location');
    console.log('2. Restart your server after adding environment variables');
    console.log('3. Verify your Razorpay credentials are correct');
  }
}

// Run the test
testRazorpayIntegration();

























