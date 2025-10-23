// Test script to verify workshops with YouTube links
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Workshop = require('./src/models/Workshop');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', async () => {
  console.log('Connected to MongoDB');

  try {
    // Fetch all workshops
    const workshops = await Workshop.find({}).limit(5);
    
    console.log('\nWorkshops with YouTube links:');
    workshops.forEach((workshop, index) => {
      console.log(`${index + 1}. ${workshop.title}`);
      console.log(`   Video URL: ${workshop.videoUrl}`);
      console.log(`   Free: ${workshop.isFree ? 'Yes' : 'No'}`);
      console.log(`   Price: ₹${workshop.price}`);
      console.log('');
    });
    
    console.log(`Total workshops found: ${workshops.length}`);
    
  } catch (error) {
    console.error('Error fetching workshops:', error);
  } finally {
    mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
});