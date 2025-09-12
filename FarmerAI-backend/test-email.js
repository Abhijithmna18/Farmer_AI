// Test script for email service
// Run with: node test-email.js

require('dotenv').config();
const { sendEmail } = require('./src/services/email.service');

async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Test 1: Object format (new way)
    console.log('\n--- Test 1: Object format ---');
    await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email (Object Format)',
      html: '<h1>Test Email</h1><p>This is a test email using object format.</p>',
      text: 'Test Email - This is a test email using object format.'
    });
    console.log('✅ Object format test passed');
    
    // Test 2: String format (old way)
    console.log('\n--- Test 2: String format ---');
    await sendEmail(
      'test@example.com',
      'Test Email (String Format)',
      '<h1>Test Email</h1><p>This is a test email using string format.</p>'
    );
    console.log('✅ String format test passed');
    
    // Test 3: Invalid email (should fail)
    console.log('\n--- Test 3: Invalid email (should fail) ---');
    try {
      await sendEmail({
        to: null,
        subject: 'Test',
        html: '<p>Test</p>'
      });
      console.log('❌ Should have failed with null email');
    } catch (error) {
      console.log('✅ Correctly failed with null email:', error.message);
    }
    
    console.log('\n🎉 All email service tests completed!');
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testEmailService();
}

module.exports = { testEmailService };


