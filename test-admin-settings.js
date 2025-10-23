// Test script for admin settings endpoints
const axios = require('axios');

// Use a fake token for testing
const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY2ZjYwZjYwZjYwZjYwZjYwZjYwZjYwIiwiaWF0IjoxNzI5MDc0NzY0fQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Authorization': `Bearer ${fakeToken}`
  }
});

async function testEndpoints() {
  try {
    console.log('Testing admin settings endpoints...');
    
    // Test get admin preferences
    console.log('\n1. Testing GET /admin/settings/preferences');
    try {
      const prefsResponse = await api.get('/admin/settings/preferences');
      console.log('✓ Success:', prefsResponse.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }
    
    // Test get system configuration
    console.log('\n2. Testing GET /admin/settings/system');
    try {
      const sysResponse = await api.get('/admin/settings/system');
      console.log('✓ Success:', sysResponse.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }
    
    // Test get environment configuration
    console.log('\n3. Testing GET /admin/settings/environment');
    try {
      const envResponse = await api.get('/admin/settings/environment');
      console.log('✓ Success:', envResponse.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }
    
    // Test get configuration logs
    console.log('\n4. Testing GET /admin/settings/logs');
    try {
      const logsResponse = await api.get('/admin/settings/logs');
      console.log('✓ Success:', logsResponse.data);
    } catch (error) {
      console.log('✗ Error:', error.response?.data || error.message);
    }
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

testEndpoints();