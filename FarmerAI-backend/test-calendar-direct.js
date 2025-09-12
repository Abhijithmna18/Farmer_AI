const mongoose = require('mongoose');
const { createGrowthCalendar } = require('./src/controllers/calendar.controller');
const User = require('./src/models/User');

async function testCalendarDirect() {
  try {
    await mongoose.connect('mongodb://localhost:27017/farmerai');
    console.log('Connected to database');

    // Get test user
    const user = await User.findOne({ email: 'test@example.com' });
    if (!user) {
      console.log('Test user not found');
      return;
    }

    console.log('Test user found:', user._id);

    // Mock request and response
    const mockReq = {
      user: { id: user._id },
      body: {
        cropName: "rice",
        variety: "20.1",
        plantingDate: "2025-05-10",
        regionalClimate: "hot",
        stages: [
          { name: "seed", startDate: "2025-05-10", endDate: "2025-05-17" },
          { name: "sprout", startDate: "2025-05-18", endDate: "2025-05-24" }
        ]
      }
    };

    const mockRes = {
      status: (code) => ({
        json: (data) => {
          console.log('Response status:', code);
          console.log('Response data:', JSON.stringify(data, null, 2));
          return data;
        }
      })
    };

    console.log('Calling createGrowthCalendar...');
    await createGrowthCalendar(mockReq, mockRes);

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testCalendarDirect();
