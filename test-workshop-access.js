// Test script to check if workshop exists and access endpoint works
// Run with: node test-workshop-access.js

require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const request = require('supertest');
const workshopRoutes = require('./FarmerAI-backend/src/routes/workshop.routes');
const { connectDB } = require('./FarmerAI-backend/src/config/db');

async function testWorkshopAccess() {
  try {
    // Connect to database
    await connectDB();
    console.log('✅ Connected to database');
    
    // Check if workshop exists
    const Workshop = require('./FarmerAI-backend/src/models/Workshop');
    const workshopId = '68f8433bb5ad11eb3940d692';
    const workshop = await Workshop.findById(workshopId);
    
    if (workshop) {
      console.log('✅ Workshop found:', workshop.title);
      console.log('Workshop isFree:', workshop.isFree);
    } else {
      console.log('❌ Workshop not found with ID:', workshopId);
      
      // List all workshops to see what's available
      const allWorkshops = await Workshop.find().limit(10);
      console.log('Available workshops:');
      allWorkshops.forEach(w => {
        console.log(`  - ${w._id}: ${w.title} (isFree: ${w.isFree})`);
      });
      return;
    }
    
    // Test the route directly
    const app = express();
    app.use(express.json());
    app.use('/workshops', workshopRoutes);
    
    // Make a request to the access endpoint
    console.log('Testing access endpoint...');
    const response = await request(app)
      .get(`/workshops/${workshopId}/access`)
      .expect(401); // Should get 401 because no auth token
    
    console.log('Access endpoint test result:', response.status, response.body);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testWorkshopAccess();
}

module.exports = { testWorkshopAccess };