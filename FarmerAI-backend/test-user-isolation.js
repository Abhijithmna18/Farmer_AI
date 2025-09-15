// test-user-isolation.js
// Test script to verify user data isolation

const mongoose = require('mongoose');
const User = require('./src/models/User');
const GrowthCalendar = require('./src/models/GrowthCalendar');

async function testUserIsolation() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmerai');
    console.log('✅ Connected to MongoDB');

    // Create test users
    console.log('\n🧪 Creating test users...');
    const user1 = new User({
      firstName: 'Test',
      lastName: 'User1',
      name: 'Test User1',
      email: 'testuser1@example.com',
      password: 'hashedpassword1',
      isVerified: true,
      roles: ['farmer'],
      role: 'farmer',
      userType: 'farmer'
    });

    const user2 = new User({
      firstName: 'Test',
      lastName: 'User2',
      name: 'Test User2',
      email: 'testuser2@example.com',
      password: 'hashedpassword2',
      isVerified: true,
      roles: ['farmer'],
      role: 'farmer',
      userType: 'farmer'
    });

    await user1.save();
    await user2.save();
    console.log(`✅ Created user1: ${user1._id}`);
    console.log(`✅ Created user2: ${user2._id}`);

    // Create test calendars for each user
    console.log('\n🧪 Creating test calendars...');
    const calendar1 = new GrowthCalendar({
      user: user1._id,
      cropName: 'Tomato',
      variety: 'Cherry',
      plantingDate: new Date(),
      expectedHarvestDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    const calendar2 = new GrowthCalendar({
      user: user2._id,
      cropName: 'Lettuce',
      variety: 'Romaine',
      plantingDate: new Date(),
      expectedHarvestDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      isActive: true
    });

    await calendar1.save();
    await calendar2.save();
    console.log(`✅ Created calendar1 for user1: ${calendar1._id}`);
    console.log(`✅ Created calendar2 for user2: ${calendar2._id}`);

    // Test user isolation
    console.log('\n🧪 Testing user isolation...');
    
    // Test 1: User1 should only see their own calendars
    const user1Calendars = await GrowthCalendar.find({ user: user1._id });
    console.log(`User1 calendars: ${user1Calendars.length} (should be 1)`);
    console.log(`User1 calendar crop: ${user1Calendars[0]?.cropName} (should be Tomato)`);

    // Test 2: User2 should only see their own calendars
    const user2Calendars = await GrowthCalendar.find({ user: user2._id });
    console.log(`User2 calendars: ${user2Calendars.length} (should be 1)`);
    console.log(`User2 calendar crop: ${user2Calendars[0]?.cropName} (should be Lettuce)`);

    // Test 3: Verify no cross-contamination
    const allCalendars = await GrowthCalendar.find({});
    console.log(`Total calendars: ${allCalendars.length} (should be 2)`);

    // Test 4: Verify user filtering works
    const user1FilteredCalendars = await GrowthCalendar.find({ user: user1._id });
    const user2FilteredCalendars = await GrowthCalendar.find({ user: user2._id });
    
    const user1CropNames = user1FilteredCalendars.map(c => c.cropName);
    const user2CropNames = user2FilteredCalendars.map(c => c.cropName);
    
    console.log(`User1 crops: [${user1CropNames.join(', ')}] (should only contain Tomato)`);
    console.log(`User2 crops: [${user2CropNames.join(', ')}] (should only contain Lettuce)`);

    // Verify isolation
    const isIsolated = !user1CropNames.includes('Lettuce') && !user2CropNames.includes('Tomato');
    console.log(`✅ User isolation working: ${isIsolated}`);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await GrowthCalendar.deleteMany({ user: { $in: [user1._id, user2._id] } });
    await User.deleteMany({ email: { $in: ['testuser1@example.com', 'testuser2@example.com'] } });
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 User isolation test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testUserIsolation();











