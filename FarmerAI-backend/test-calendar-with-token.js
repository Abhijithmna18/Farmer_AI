const axios = require('axios');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function testCalendarWithToken() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai');
    console.log('Connected to database');

    // Get test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    // Create JWT token manually
    const JWT_SECRET = process.env.JWT_SECRET || 'change_me';
    const token = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles, userType: user.userType },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log('Created token:', token.substring(0, 20) + '...');

    const calendarPayload = {
      cropName: "rice",
      variety: "20.1",
      plantingDate: "2025-05-10",
      regionalClimate: "hot",
      stages: [
        { name: "seed", startDate: "2025-05-10", endDate: "2025-05-17" },
        { name: "sprout", startDate: "2025-05-18", endDate: "2025-05-24" }
      ]
    };

    console.log('Sending payload:', JSON.stringify(calendarPayload, null, 2));

    const response = await axios.post('http://localhost:5000/api/calendar', calendarPayload, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Calendar created successfully!');
    console.log('Response:', JSON.stringify(response.data, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating calendar:');
    console.error('Status:', error.response?.status);
    console.error('Status Text:', error.response?.statusText);
    console.error('Response Data:', JSON.stringify(error.response?.data, null, 2));
    console.error('Request URL:', error.config?.url);
    console.error('Request Method:', error.config?.method);
    process.exit(1);
  }
}

testCalendarWithToken();
