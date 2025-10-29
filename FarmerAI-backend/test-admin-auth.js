// Test script to check admin authentication
const axios = require('axios');

async function testAdminAuth() {
  try {
    console.log('Testing admin authentication...');
    
    // Get token from localStorage (this would be done in browser)
    const token = process.env.TEST_TOKEN || 'your-token-here';
    
    if (!token || token === 'your-token-here') {
      console.log('❌ No token provided. Please set TEST_TOKEN environment variable or update the script.');
      console.log('To get a token:');
      console.log('1. Login to the frontend');
      console.log('2. Open browser dev tools');
      console.log('3. Go to Application > Local Storage');
      console.log('4. Copy the token value');
      console.log('5. Set it as TEST_TOKEN environment variable');
      return;
    }
    
    const response = await axios.get('http://localhost:5002/api/admin/events', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Admin events endpoint accessible');
    console.log('Response status:', response.status);
    console.log('Events count:', response.data?.length || 0);
    
  } catch (error) {
    console.error('❌ Admin authentication failed');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message || error.message);
    
    if (error.response?.status === 401) {
      console.log('\n🔧 Solutions:');
      console.log('1. Check if you are logged in');
      console.log('2. Verify your token is valid');
      console.log('3. Make sure you have admin role');
    } else if (error.response?.status === 403) {
      console.log('\n🔧 Solutions:');
      console.log('1. Make sure your user has admin role');
      console.log('2. Check if the backend server is running');
      console.log('3. Verify the admin routes are properly configured');
    }
  }
}

testAdminAuth();

