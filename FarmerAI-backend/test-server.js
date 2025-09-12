const axios = require('axios');

async function testServer() {
  try {
    console.log('🔍 Testing server health...');

    const response = await axios.get('http://localhost:5000/');
    console.log('✅ Server is responding');
    console.log('Response:', response.data);

    console.log('🔐 Testing auth endpoint...');
    const authResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

  } catch (error) {
    console.error('❌ Server test failed:');
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error Message:', error.message);
  }
}

testServer();
