// Test database connection
require('dotenv').config({ path: __dirname + '/.env' });
const { connectDB } = require('./src/config/db');
const SensorData = require('./src/models/SensorData');

async function testDB() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');
    
    // Try to access the collection
    console.log('Testing SensorData model...');
    const count = await SensorData.countDocuments();
    console.log(`Found ${count} sensor data documents`);
  } catch (error) {
    console.error('Database test failed:', error);
  }
}

testDB();