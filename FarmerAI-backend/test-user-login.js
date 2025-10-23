const axios = require('axios');

async function testUserLogin() {
  try {
    console.log('🔐 Testing user login...');

    const loginResponse = await axios.post('http://localhost:5002/api/auth/login', {
      email: 'abelsunilcherian2026@mca.ajce.in',
      password: 'Abel2001#'
    });

    console.log('✅ User login successful');
    console.log('Token:', loginResponse.data.token ? 'Present' : 'Missing');
    console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));
    console.log('Role in response:', loginResponse.data.user?.role);

    // Test the /auth/me endpoint with the token
    console.log('\n🔍 Testing /auth/me endpoint...');
    const meResponse = await axios.get('http://localhost:5002/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    console.log('✅ /auth/me successful');
    console.log('User from /auth/me:', JSON.stringify(meResponse.data.user, null, 2));
    console.log('Role from /auth/me:', meResponse.data.user?.role);

  } catch (error) {
    console.error('❌ User login failed:');
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testUserLogin();
