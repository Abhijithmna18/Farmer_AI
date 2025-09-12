const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestUser() {
  try {
    // Connect to the same database as the server
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/farmerai');
    console.log('Connected to database');

    const testEmail = 'test@example.com';
    const testPassword = 'TestPass123'; // Updated to meet validation requirements

    const existingUser = await User.findOne({ email: testEmail });

    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      const testUser = new User({
        name: 'Test User',
        email: testEmail,
        password: hashedPassword,
        roles: ['farmer'],
        userType: 'farmer',
        verified: true,
      });
      await testUser.save();
      console.log('✅ Test user created successfully!');
      console.log('Email:', testEmail);
      console.log('Password:', testPassword);
    } else {
      console.log('✅ Test user already exists.');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createTestUser();
