// Test script for email service
// Run with: node test-email.js

require('dotenv').config();
const { sendEmail, sendRawEmail } = require('./src/services/email.service');

async function testEmailService() {
  console.log('Testing email service...');
  
  try {
    // Test 1: Template-based email
    console.log('\n--- Test 1: Template-based email ---');
    await sendEmail(
      'abhijithmnair119@gmail.com',  // to
      'bookingConfirmation',         // template
      {
        farmerName: 'Test Farmer',
        bookingId: 'BKTEST123',
        warehouseName: 'Test Warehouse',
        warehouseLocation: 'Test Location',
        storageType: 'Cold Storage',
        produceType: 'Wheat',
        quantity: 100,
        unit: 'kg',
        startDate: '2025-10-25',
        endDate: '2025-11-25',
        totalAmount: 5000
      }
    );
    console.log('✅ Template-based email test passed');
    
    // Test 2: Raw email
    console.log('\n--- Test 2: Raw email ---');
    await sendRawEmail(
      'abhijithmnair119@gmail.com',
      'Test Email (Raw Format)',
      '<h1>Test Email</h1><p>This is a test email using raw format.</p>'
    );
    console.log('✅ Raw email test passed');
    
    // Test 3: Warehouse booking reminder
    console.log('\n--- Test 3: Warehouse booking reminder ---');
    await sendEmail(
      'abhijithmnair119@gmail.com',  // to
      'warehouseBookingReminder',    // template
      {
        farmerName: 'Test Farmer',
        bookingId: 'BKTEST456',
        warehouseName: 'Test Warehouse',
        warehouseLocation: 'Test Location',
        produceType: 'Rice',
        quantity: 200,
        unit: 'kg',
        startDate: '2025-10-20',
        endDate: '2025-11-20',
        daysRemaining: 3,
        totalAmount: 3000
      }
    );
    console.log('✅ Warehouse booking reminder test passed');
    
    console.log('\n🎉 All email service tests completed!');
    
  } catch (error) {
    console.error('❌ Email service test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testEmailService();
}

module.exports = { testEmailService };