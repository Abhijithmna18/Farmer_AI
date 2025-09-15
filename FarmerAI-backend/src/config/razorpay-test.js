// src/config/razorpay-test.js
// Test configuration for Razorpay integration

const testRazorpayConfig = {
  // Test credentials (replace with your actual test credentials)
  key_id: 'rzp_test_1234567890', // Your Razorpay test key ID
  key_secret: 'your_test_secret_key', // Your Razorpay test secret key
  
  // Test webhook secret
  webhook_secret: 'your_test_webhook_secret',
  
  // Test environment
  environment: 'test' // or 'live' for production
};

// Example of how to use in your .env file
const envExample = `
# Add these to your .env file
RAZORPAY_KEY_ID=rzp_test_1234567890
RAZORPAY_KEY_SECRET=your_test_secret_key
RAZORPAY_WEBHOOK_SECRET=your_test_webhook_secret
`;

module.exports = {
  testRazorpayConfig,
  envExample
};





