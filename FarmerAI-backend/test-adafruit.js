// Simple test script to verify Adafruit service
require('dotenv').config({ path: __dirname + '/.env' });
const adafruitService = require('./src/services/adafruit.service');

console.log('Testing Adafruit service...');
console.log('Environment variables:');
console.log('- ADAFRUIT_IO_USERNAME:', process.env.ADAFRUIT_IO_USERNAME);
console.log('- ADAFRUIT_IO_KEY:', process.env.ADAFRUIT_IO_KEY ? '[SET]' : '[NOT SET]');

// Test the service
async function testAdafruitService() {
  try {
    console.log('Checking required feeds...');
    const feedStatus = await adafruitService.checkRequiredFeeds();
    console.log('Feed status:', feedStatus);
    
    console.log('Fetching all sensor data...');
    const data = await adafruitService.getAllSensorData();
    console.log('Sensor data:', data);
  } catch (error) {
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAdafruitService();