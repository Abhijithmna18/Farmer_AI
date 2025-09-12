const axios = require('axios');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');

    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'abhijithmnair2002@gmail.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful');
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));

    // Extract token and test /auth/me
    const token = loginResponse.data.token;
    console.log('\n🔍 Testing /auth/me with token...');

    const meResponse = await axios.get('http://localhost:5000/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ /auth/me successful');
    console.log('User data:', JSON.stringify(meResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Error:');
    console.error('Status:', error.response?.status);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Error message:', error.message);
  }
}

testAdminLogin();
