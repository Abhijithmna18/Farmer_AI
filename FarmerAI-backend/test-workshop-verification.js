// Test script to verify workshops exist in the database
// Run with: node test-workshop-verification.js

require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

async function testWorkshopVerification() {
  try {
    // Connect to the same database as the seeding script
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Load the Workshop model
    const Workshop = require('./src/models/Workshop');
    
    // Check if workshops exist
    const workshopCount = await Workshop.countDocuments();
    console.log(`Found ${workshopCount} workshops in the database`);
    
    if (workshopCount > 0) {
      // Get a few workshops to display
      const workshops = await Workshop.find().limit(5);
      console.log('\nSample workshops:');
      workshops.forEach((workshop, index) => {
        console.log(`${index + 1}. ${workshop.title} (ID: ${workshop._id}) - Free: ${workshop.isFree ? 'Yes' : 'No'}`);
      });
    } else {
      console.log('No workshops found in the database');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testWorkshopVerification();
}

module.exports = { testWorkshopVerification };