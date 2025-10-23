// Test script to debug subscription order creation
require('dotenv').config();
const axios = require('axios');

async function testSubscriptionOrder() {
  try {
    console.log('Testing subscription order creation...');
    
    // First, let's try to login to get a valid token
    // You'll need to replace these with valid credentials
    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'test@example.com',
      password: 'TestPass123'
    });
    
    const token = loginResponse.data.token;
    console.log('Login successful, token received');
    
    // Now test the subscription order creation
    const subscriptionResponse = await axios.post(
      'http://localhost:5002/api/workshops/subscription/order',
      {
        type: 'monthly'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('Subscription order created successfully:');
    console.log('Response:', subscriptionResponse.data);
    
  } catch (error) {
    console.error('Error creating subscription order:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
      console.error('Headers:', error.response.headers);
    } else {
      console.error('Message:', error.message);
      console.error('Stack:', error.stack);
    }
  }
}

testSubscriptionOrder();