// Test fetching sensor data
const axios = require('axios');

async function fetchSensorData() {
  try {
    const response = await axios.post('http://localhost:5002/api/farm-monitoring/fetch', {}, {
      headers: {
        'Authorization': 'Bearer YOUR_AUTH_TOKEN_HERE'
      }
    });
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

fetchSensorData();