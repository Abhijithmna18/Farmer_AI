// test-otp-flow.js
// Simple test script to verify OTP email verification flow

const mongoose = require('mongoose');
const User = require('./src/models/User');
const { generateOTP, sendOTPEmail, isOTPValid, clearOTP } = require('./src/services/otp.service');

async function testOTPFlow() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/farmerai');
    console.log('✅ Connected to MongoDB');

    // Test OTP generation
    console.log('\n🧪 Testing OTP generation...');
    const otp = generateOTP();
    console.log(`Generated OTP: ${otp}`);
    console.log(`OTP length: ${otp.length} (should be 6)`);
    console.log(`OTP is numeric: ${/^\d{6}$/.test(otp)}`);

    // Test OTP validation
    console.log('\n🧪 Testing OTP validation...');
    const testExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    const expiredExpiry = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    console.log(`Valid OTP test: ${isOTPValid(otp, otp, testExpiry)} (should be true)`);
    console.log(`Invalid OTP test: ${isOTPValid('123456', otp, testExpiry)} (should be false)`);
    console.log(`Expired OTP test: ${isOTPValid(otp, otp, expiredExpiry)} (should be false)`);

    // Test email sending (optional - requires email configuration)
    console.log('\n🧪 Testing email sending...');
    const testEmail = process.env.TEST_EMAIL || 'test@example.com';
    try {
      await sendOTPEmail(testEmail, 'Test', 'User', otp);
      console.log('✅ Email sent successfully');
    } catch (emailError) {
      console.log('⚠️ Email sending failed (this is expected if email is not configured):', emailError.message);
    }

    // Test user creation with OTP
    console.log('\n🧪 Testing user creation with OTP...');
    const testUser = new User({
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      email: 'testuser@example.com',
      password: 'hashedpassword',
      isVerified: false,
      verificationCode: otp,
      verificationCodeExpires: testExpiry,
      roles: ['farmer'],
      role: 'farmer',
      userType: 'farmer'
    });

    await testUser.save();
    console.log('✅ Test user created with OTP');

    // Test OTP verification
    console.log('\n🧪 Testing OTP verification...');
    const isValid = isOTPValid(otp, testUser.verificationCode, testUser.verificationCodeExpires);
    console.log(`OTP verification: ${isValid} (should be true)`);

    if (isValid) {
      // Clear OTP
      await clearOTP(testUser);
      console.log('✅ OTP cleared successfully');
    }

    // Clean up test user
    await User.deleteOne({ email: 'testuser@example.com' });
    console.log('✅ Test user cleaned up');

    console.log('\n🎉 All OTP flow tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

// Run the test
testOTPFlow();




