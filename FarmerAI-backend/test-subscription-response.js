// Test script to see the exact response structure from subscription order creation
require('dotenv').config();
const axios = require('axios');

// Replace with a valid token from your application
const TEST_TOKEN = process.env.TEST_JWT_TOKEN || null;

async function testSubscriptionResponse() {
  try {
    console.log('=== Testing Subscription Order Response Structure ===\n');
    
    if (!TEST_TOKEN) {
      console.log('⚠️  Please set TEST_JWT_TOKEN environment variable with a valid JWT token');
      console.log('   You can get this by logging in through the frontend and copying the token from localStorage');
      return;
    }
    
    console.log('Using token (first 20 chars):', TEST_TOKEN.substring(0, 20) + '...');
    
    // Test subscription order creation
    console.log('\nCreating subscription order...');
    const response = await axios.post(
      'http://localhost:5002/api/workshops/subscription/order',
      { type: 'monthly' },
      {
        headers: {
          'Authorization': `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Subscription order created successfully');
    console.log('\nFull response structure:');
    console.log(JSON.stringify(response, null, 2));
    
    console.log('\nResponse data structure:');
    console.log(JSON.stringify(response.data, null, 2));
    
    console.log('\nChecking required properties:');
    const data = response.data;
    console.log('  success:', data.success);
    console.log('  data:', data.data);
    
    if (data.data) {
      console.log('  data.orderId:', data.data.orderId);
      console.log('  data.amount:', data.data.amount);
      console.log('  data.currency:', data.data.currency);
      console.log('  data.subscriptionId:', data.data.subscriptionId);
    }
    
  } catch (error) {
    console.log('❌ Error creating subscription order:');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Headers:', JSON.stringify(error.response.headers, null, 2));
      console.log('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.log('Message:', error.message);
      console.log('Stack:', error.stack);
    }
  }
}

testSubscriptionResponse();