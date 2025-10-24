// Debug script to troubleshoot subscription order creation
require('dotenv').config();
const axios = require('axios');

async function debugSubscriptionOrder() {
  try {
    console.log('=== Debugging Subscription Order Creation ===\n');
    
    // Check if required environment variables are set
    console.log('1. Checking environment variables...');
    if (!process.env.RAZORPAY_KEY_ID) {
      console.log('❌ RAZORPAY_KEY_ID is not set');
    } else {
      console.log('✅ RAZORPAY_KEY_ID is set');
    }
    
    if (!process.env.RAZORPAY_KEY_SECRET) {
      console.log('❌ RAZORPAY_KEY_SECRET is not set');
    } else {
      console.log('✅ RAZORPAY_KEY_SECRET is set');
    }
    
    console.log('\n2. Testing backend connectivity...');
    
    // Test if backend is accessible
    try {
      const healthCheck = await axios.get('http://localhost:5002/');
      console.log('✅ Backend is accessible');
      console.log('   Message:', healthCheck.data.message);
    } catch (error) {
      console.log('❌ Backend is not accessible');
      console.log('   Error:', error.message);
      return;
    }
    
    console.log('\n3. Testing workshop API endpoint...');
    
    // Test if workshop API is accessible
    try {
      const workshopsResponse = await axios.get('http://localhost:5002/api/workshops');
      console.log('✅ Workshop API is accessible');
      console.log('   Found', workshopsResponse.data.data?.length || 0, 'workshops');
    } catch (error) {
      console.log('❌ Workshop API is not accessible');
      console.log('   Error:', error.message);
      if (error.response) {
        console.log('   Status:', error.response.status);
        console.log('   Data:', error.response.data);
      }
      return;
    }
    
    console.log('\n4. Testing subscription order creation (without auth)...');
    
    // Test subscription order creation without authentication
    try {
      const subscriptionResponse = await axios.post(
        'http://localhost:5002/api/workshops/subscription/order',
        { type: 'monthly' },
        { headers: { 'Content-Type': 'application/json' } }
      );
      console.log('❌ Expected authentication error but got success');
      console.log('   Response:', subscriptionResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('✅ Authentication is required (as expected)');
        console.log('   Message:', error.response.data.message);
      } else {
        console.log('❌ Unexpected error during authentication test');
        console.log('   Error:', error.message);
        if (error.response) {
          console.log('   Status:', error.response.status);
          console.log('   Data:', error.response.data);
        }
      }
    }
    
    console.log('\n=== Debug Complete ===');
    console.log('\nTo test with authentication, you need a valid JWT token.');
    console.log('You can get this by logging in through the frontend and checking localStorage.');
    
  } catch (error) {
    console.error('Unexpected error during debugging:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugSubscriptionOrder();