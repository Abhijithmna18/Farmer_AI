const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abhijithmnair2002@gmail.com',
      password: 'Admin@123'
    });

    console.log('✅ Admin login successful');
    console.log('Token:', loginResponse.data.token ? 'Present' : 'Missing');
    console.log('User:', JSON.stringify(loginResponse.data.user, null, 2));
    console.log('Role in response:', loginResponse.data.user?.role);

    // Test the /auth/me endpoint with the token
    console.log('\n🔍 Testing /auth/me endpoint...');
    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`
      }
    });

    console.log('✅ /auth/me successful');
    console.log('User from /auth/me:', JSON.stringify(meResponse.data.user, null, 2));
    console.log('Role from /auth/me:', meResponse.data.user?.role);

  } catch (error) {
    console.error('❌ Admin login failed:');
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
  }
}

testAdminLogin();
