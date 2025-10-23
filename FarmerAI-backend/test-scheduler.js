// Test script for the enhanced sensor data scheduler
require('dotenv').config({ path: __dirname + '/.env' });
const { connectDB } = require('./src/config/db');
const enhancedScheduler = require('./src/services/enhanced-sensor-data-scheduler.service');

console.log('Testing enhanced sensor data scheduler...');

async function runTest() {
  try {
    // Connect to database first
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected successfully');
    
    // Test manual fetch
    console.log('Triggering manual fetch...');
    await enhancedScheduler.triggerManualFetch();
    console.log('Manual fetch completed successfully');
  } catch (error) {
    console.error('Error during test:', error.message);
  }
}

runTest();