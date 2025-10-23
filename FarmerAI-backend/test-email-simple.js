// Simple test script for email service without database
// Run with: node test-email-simple.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailService() {
  console.log('Testing email service...');
  
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
    
    // Send test email
    const info = await transporter.sendMail({
      from: `"FarmerAI Test" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "Test Email from FarmerAI",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2d5016;">Email Service Test</h2>
          <p>This is a test email to verify that the email service is working properly.</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Configuration Details</h3>
            <p><strong>Host:</strong> ${process.env.EMAIL_HOST || 'smtp.gmail.com'}</p>
            <p><strong>Port:</strong> ${process.env.EMAIL_PORT || 587}</p>
            <p><strong>Secure:</strong> ${String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || false}</p>
          </div>
          <p>If you received this email, the email service is configured correctly!</p>
        </div>
      `
    });
    
    console.log('✅ Test email sent successfully');
    console.log('Message ID:', info.messageId);
    
    console.log('\n🎉 Email service test completed successfully!');
    
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