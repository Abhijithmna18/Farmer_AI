// Test script for warehouse booking reminder functionality
// Run with: node test-warehouse-reminder.js

require('dotenv').config();
const { sendWarehouseBookingReminder, sendWarehouseOwnerReminder } = require('./src/services/email.service');

async function testWarehouseReminders() {
  console.log('Testing warehouse booking reminder functionality...');
  
  try {
    // Test farmer reminder
    console.log('\n--- Test 1: Farmer Reminder ---');
    await sendWarehouseBookingReminder(
      process.env.EMAIL_USER,  // Send to admin email for testing
      {
        farmerName: 'Test Farmer',
        bookingId: 'BKTEST789',
        warehouseName: 'Test Warehouse',
        warehouseLocation: 'Test City, Test State',
        produceType: 'Wheat',
        quantity: 500,
        unit: 'kg',
        startDate: '2025-10-25',
        endDate: '2025-11-25',
        daysRemaining: 3,
        totalAmount: 7500
      }
    );
    console.log('✅ Farmer reminder test passed');
    
    // Test owner reminder
    console.log('\n--- Test 2: Owner Reminder ---');
    await sendWarehouseOwnerReminder(
      process.env.EMAIL_USER,  // Send to admin email for testing
      {
        ownerName: 'Test Owner',
        bookingId: 'BKTEST789',
        warehouseName: 'Test Warehouse',
        farmerName: 'Test Farmer',
        farmerEmail: 'farmer@example.com',
        farmerPhone: '+91 9876543210',
        produceType: 'Wheat',
        quantity: 500,
        unit: 'kg',
        startDate: '2025-10-25',
        endDate: '2025-11-25',
        daysRemaining: 3
      }
    );
    console.log('✅ Owner reminder test passed');
    
    console.log('\n🎉 All warehouse reminder tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Warehouse reminder test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  testWarehouseReminders();
}

module.exports = { testWarehouseReminders };