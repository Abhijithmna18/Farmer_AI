// Test script for warehouse booking reminder functionality (simplified version without DB)
// Run with: node test-warehouse-reminder-simple.js

require('dotenv').config();
const nodemailer = require('nodemailer');

// Email templates (copied from email.service.js)
const emailTemplates = {
  // Warehouse booking reminder template
  warehouseBookingReminder: (data) => ({
    subject: `Warehouse Booking Reminder - ${data.warehouseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Warehouse Booking Reminder</h2>
        <p>Dear ${data.farmerName},</p>
        <p>This is a friendly reminder that your warehouse booking is ending soon.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Location:</strong> ${data.warehouseLocation}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
          <p><strong>Booking Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
          <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
        </div>
        
        ${data.daysRemaining <= 3 ? `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>⚠️ Important Notice</h3>
          <p>Your booking ends in <strong>${data.daysRemaining} day(s)</strong>. Please make arrangements to remove your produce by the end date to avoid additional charges.</p>
        </div>
        ` : ''}
        
        <p>If you need to extend your booking or have any questions, please contact the warehouse owner or our support team.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  // Warehouse owner reminder template
  warehouseOwnerReminder: (data) => ({
    subject: `Warehouse Booking Ending Soon - ${data.warehouseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Warehouse Booking Ending Soon</h2>
        <p>Dear ${data.ownerName},</p>
        <p>This is a reminder that a booking for your warehouse is ending soon.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Contact:</strong> ${data.farmerEmail} | ${data.farmerPhone || 'N/A'}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
          <p><strong>Booking Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Days Remaining:</strong> ${data.daysRemaining}</p>
        </div>
        
        ${data.daysRemaining <= 3 ? `
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>⚠️ Important Notice</h3>
          <p>The booking ends in <strong>${data.daysRemaining} day(s)</strong>. Please prepare for the farmer's departure and warehouse inspection.</p>
        </div>
        ` : ''}
        
        <p>Please ensure all necessary arrangements are made for the end of this booking period.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  })
};

async function testWarehouseReminders() {
  console.log('Testing warehouse booking reminder functionality...');
  
  try {
    // Create transporter using the same configuration as the app
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: Number(process.env.EMAIL_PORT || 587),
      secure: String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Verify connection
    await transporter.verify();
    console.log('✅ Email transporter verified successfully');
    
    // Test farmer reminder
    console.log('\n--- Test 1: Farmer Reminder ---');
    const farmerTemplate = emailTemplates.warehouseBookingReminder({
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
    });
    
    const farmerInfo = await transporter.sendMail({
      from: `"FarmerAI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,  // Send to admin email for testing
      subject: farmerTemplate.subject,
      html: farmerTemplate.html
    });
    
    console.log('✅ Farmer reminder test passed');
    console.log('Message ID:', farmerInfo.messageId);
    
    // Test owner reminder
    console.log('\n--- Test 2: Owner Reminder ---');
    const ownerTemplate = emailTemplates.warehouseOwnerReminder({
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
    });
    
    const ownerInfo = await transporter.sendMail({
      from: `"FarmerAI" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,  // Send to admin email for testing
      subject: ownerTemplate.subject,
      html: ownerTemplate.html
    });
    
    console.log('✅ Owner reminder test passed');
    console.log('Message ID:', ownerInfo.messageId);
    
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