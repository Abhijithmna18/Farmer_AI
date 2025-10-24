// Test script to debug subscription order creation with a provided token
require('dotenv').config();
const axios = require('axios');

// Replace this with a valid JWT token from your application
const JWT_TOKEN = process.env.TEST_JWT_TOKEN || 'YOUR_JWT_TOKEN_HERE';

async function testSubscriptionOrderWithToken() {
  try {
    console.log('=== Testing Subscription Order Creation with Token ===\n');
    
    if (JWT_TOKEN === 'YOUR_JWT_TOKEN_HERE' || !JWT_TOKEN) {
      console.log('⚠️  Please set a valid JWT token in the JWT_TOKEN variable or TEST_JWT_TOKEN environment variable');
      console.log('   You can get this by logging in through the frontend and checking localStorage for the token.');
      return;
    }
    
    console.log('Using token (first 20 chars):', JWT_TOKEN.substring(0, 20) + '...');
    
    // Test the subscription order creation
    console.log('\nCreating subscription order...');
    const subscriptionResponse = await axios.post(
      'http://localhost:5002/api/workshops/subscription/order',
      {
        type: 'monthly'
      },
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Subscription order created successfully:');
    console.log('Response:', JSON.stringify(subscriptionResponse.data, null, 2));
    
  } catch (error) {
    console.log('❌ Error creating subscription order:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
      console.log('Headers:', error.response.headers);
    } else {
      console.log('Message:', error.message);
      console.log('Stack:', error.stack);
    }
  }
}

// Also test with different subscription types
async function testAllSubscriptionTypes() {
  const types = ['monthly', 'yearly'];
  
  for (const type of types) {
    try {
      console.log(`\n--- Testing ${type} subscription ---`);
      const response = await axios.post(
        'http://localhost:5002/api/workshops/subscription/order',
        { type },
        {
          headers: {
            'Authorization': `Bearer ${JWT_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log(`✅ ${type} subscription order created:`);
      console.log('Order ID:', response.data.data?.orderId);
      console.log('Amount:', response.data.data?.amount);
    } catch (error) {
      console.log(`❌ Error creating ${type} subscription:`);
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Data:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Message:', error.message);
      }
    }
  }
}

// Run the tests
if (JWT_TOKEN && JWT_TOKEN !== 'YOUR_JWT_TOKEN_HERE') {
  testSubscriptionOrderWithToken().then(() => {
    return testAllSubscriptionTypes();
  });
} else {
  testSubscriptionOrderWithToken();
}