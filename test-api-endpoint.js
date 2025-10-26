const axios = require('axios');

// Test the admin stats endpoint
async function testAdminStatsAPI() {
  try {
    console.log('🚀 Testing admin stats API endpoint...\n');
    
    // Test without authentication first to see the error
    console.log('1. Testing without authentication:');
    try {
      const response = await axios.get('http://localhost:5002/api/admin/stats');
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error (no auth):', error.response?.status, error.response?.data?.message);
    }
    
    // Test with a dummy token to see the error
    console.log('\n2. Testing with dummy token:');
    try {
      const response = await axios.get('http://localhost:5002/api/admin/stats', {
        headers: {
          'Authorization': 'Bearer dummy-token',
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Response:', response.data);
    } catch (error) {
      console.log('❌ Expected error (invalid token):', error.response?.status, error.response?.data?.message);
    }
    
    // Test other endpoints to see if they're working
    console.log('\n3. Testing other endpoints:');
    try {
      const response = await axios.get('http://localhost:5002/api/auth/me');
      console.log('✅ Auth endpoint working:', response.status);
    } catch (error) {
      console.log('❌ Auth endpoint error:', error.response?.status, error.response?.data?.message);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

// Run the test
testAdminStatsAPI();
