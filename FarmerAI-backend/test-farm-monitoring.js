// Test script to verify farm monitoring endpoint
require('dotenv').config();
const mongoose = require('mongoose');
const { connectDB } = require('./src/config/db');

console.log('Testing farm monitoring endpoint...');

// Connect to database
connectDB().then(async () => {
  console.log('✅ Connected to database');
  
  // Test the SensorData model
  const SensorData = require('./src/models/SensorData');
  
  try {
    // Check if there's any data in the collection
    const count = await SensorData.countDocuments();
    console.log(`📊 Found ${count} sensor data records in database`);
    
    // Try to get the latest reading
    const latest = await SensorData.getLatest();
    if (latest) {
      console.log('✅ Latest sensor data found:');
      console.log('  Temperature:', latest.temperature);
      console.log('  Humidity:', latest.humidity);
      console.log('  Soil Moisture:', latest.soilMoisture);
      console.log('  Timestamp:', latest.timestamp);
    } else {
      console.log('⚠️ No sensor data found in database');
      
      // Create a sample record for testing
      console.log('➕ Creating sample sensor data for testing...');
      const sampleData = new SensorData({
        temperature: 25.5,
        humidity: 60.2,
        soilMoisture: 750,
        timestamp: new Date(),
        source: 'Manual'
      });
      
      await sampleData.save();
      console.log('✅ Sample sensor data created successfully');
    }
    
    // Test the getLatest method directly
    const latestAfterSample = await SensorData.getLatest();
    if (latestAfterSample) {
      console.log('✅ getLatest() method works correctly');
      console.log('  Latest data ID:', latestAfterSample._id);
    }
    
  } catch (error) {
    console.error('❌ Error testing SensorData model:', error.message);
  } finally {
    mongoose.connection.close();
    console.log('✅ Database connection closed');
    console.log('\n✅ Farm monitoring test completed');
  }
}).catch(err => {
  console.error('❌ Database connection failed:', err.message);
});