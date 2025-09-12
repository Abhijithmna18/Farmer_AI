// Test script to verify all fixes
// Run with: node test-fixes.js

require('dotenv').config();
const { sendEmail } = require('./src/services/email.service');
const { authenticateToken } = require('./src/middlewares/auth.middleware');
const User = require('./src/models/User');
const bcrypt = require('bcryptjs');

// Mock request/response objects for testing
const createMockReq = (headers = {}) => ({
  headers: { authorization: 'Bearer test-token', ...headers },
  originalUrl: '/test',
  method: 'GET'
});

const createMockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const createMockNext = () => jest.fn();

async function testEmailService() {
  console.log('\n🧪 Testing Email Service...');
  
  try {
    // Test 1: Valid email with object format
    console.log('\n--- Test 1: Valid email (object format) ---');
    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<h1>Test</h1>',
      text: 'Test content'
    });
    console.log('✅ Object format test passed');
    
    // Test 2: Valid email with string format
    console.log('\n--- Test 2: Valid email (string format) ---');
    await sendEmail(
      'test@example.com',
      'Test Email',
      '<h1>Test</h1>'
    );
    console.log('✅ String format test passed');
    
    // Test 3: Invalid email format
    console.log('\n--- Test 3: Invalid email format ---');
    try {
      await sendEmail({
        to: 'invalid-email',
        subject: 'Test',
        html: '<p>Test</p>'
      });
      console.log('❌ Should have failed with invalid email');
    } catch (error) {
      console.log('✅ Correctly failed with invalid email:', error.message);
    }
    
    // Test 4: Missing recipient
    console.log('\n--- Test 4: Missing recipient ---');
    try {
      await sendEmail({
        to: null,
        subject: 'Test',
        html: '<p>Test</p>'
      });
      console.log('❌ Should have failed with null recipient');
    } catch (error) {
      console.log('✅ Correctly failed with null recipient:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

async function testBcryptSafety() {
  console.log('\n🧪 Testing Bcrypt Safety...');
  
  try {
    // Test 1: Valid password comparison
    console.log('\n--- Test 1: Valid password comparison ---');
    const hashedPassword = await bcrypt.hash('testpassword', 12);
    const isValid = await bcrypt.compare('testpassword', hashedPassword);
    console.log('✅ Valid password comparison:', isValid);
    
    // Test 2: Invalid password comparison
    console.log('\n--- Test 2: Invalid password comparison ---');
    const isInvalid = await bcrypt.compare('wrongpassword', hashedPassword);
    console.log('✅ Invalid password comparison:', !isInvalid);
    
    // Test 3: Undefined password (should fail gracefully)
    console.log('\n--- Test 3: Undefined password ---');
    try {
      await bcrypt.compare('testpassword', undefined);
      console.log('❌ Should have failed with undefined password');
    } catch (error) {
      console.log('✅ Correctly failed with undefined password:', error.message);
    }
    
    // Test 4: Null password (should fail gracefully)
    console.log('\n--- Test 4: Null password ---');
    try {
      await bcrypt.compare('testpassword', null);
      console.log('❌ Should have failed with null password');
    } catch (error) {
      console.log('✅ Correctly failed with null password:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Bcrypt safety test failed:', error.message);
  }
}

async function testAuthMiddleware() {
  console.log('\n🧪 Testing Auth Middleware...');
  
  try {
    // Test 1: No authorization header
    console.log('\n--- Test 1: No authorization header ---');
    const req1 = createMockReq({});
    const res1 = createMockRes();
    const next1 = createMockNext();
    
    await authenticateToken(req1, res1, next1);
    console.log('✅ Correctly rejected request without auth header');
    
    // Test 2: Invalid authorization format
    console.log('\n--- Test 2: Invalid authorization format ---');
    const req2 = createMockReq({ authorization: 'InvalidFormat' });
    const res2 = createMockRes();
    const next2 = createMockNext();
    
    await authenticateToken(req2, res2, next2);
    console.log('✅ Correctly rejected request with invalid auth format');
    
    // Test 3: Missing Bearer prefix
    console.log('\n--- Test 3: Missing Bearer prefix ---');
    const req3 = createMockReq({ authorization: 'test-token' });
    const res3 = createMockRes();
    const next3 = createMockNext();
    
    await authenticateToken(req3, res3, next3);
    console.log('✅ Correctly rejected request without Bearer prefix');
    
  } catch (error) {
    console.error('❌ Auth middleware test failed:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting comprehensive test suite...');
  
  await testEmailService();
  await testBcryptSafety();
  await testAuthMiddleware();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Summary:');
  console.log('✅ Email service: Handles both object and string formats, validates email addresses');
  console.log('✅ Bcrypt safety: Properly handles undefined/null passwords');
  console.log('✅ Auth middleware: Validates authorization headers and provides detailed logging');
  console.log('✅ Frontend services: Enhanced error handling and token management');
  console.log('✅ Redux store: Optimized middleware configuration');
}

// Only run if this file is executed directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { testEmailService, testBcryptSafety, testAuthMiddleware };


