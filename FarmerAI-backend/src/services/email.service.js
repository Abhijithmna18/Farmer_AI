// src/services/email.service.js
/**
 * Handles email sending (welcome, thank you) and Firebase links
 */
const nodemailer = require('nodemailer');
const {
  generateEmailVerificationLink,
  generatePasswordResetLink,
} = require('../config/firebase');

// Create a transporter (using SMTP credentials from .env)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_PORT === '465', // true for port 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Generic email sending function
 * @param {string|object} to - Recipient email address or email options object
 * @param {string} subject - Email subject (optional if to is an object)
 * @param {string} html - HTML body of the email (optional if to is an object)
 */
async function sendEmail(to, subject, html) {
  try {
    console.log('=== EMAIL SERVICE DEBUG ===');
    console.log('Input parameters:', { to, subject, html });
    console.log('Type of "to":', typeof to);
    console.log('Is "to" an object?', typeof to === 'object' && to !== null);
    
    // Handle both object and string parameters for backward compatibility
    let emailOptions;
    
    if (typeof to === 'object' && to !== null) {
      console.log('Processing object format email options');
      // If to is an object, use it as email options
      emailOptions = {
        from: `"FarmerAI" <${process.env.EMAIL_USER}>`,
        to: to.to,
        subject: to.subject,
        html: to.html || to.text, // Support both html and text
        text: to.text
      };
      console.log('Extracted email options:', emailOptions);
    } else {
      console.log('Processing string format email options');
      // If to is a string, use the old format
      emailOptions = {
        from: `"FarmerAI" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      };
    }

    // Validate required fields with detailed logging
    console.log('Validating email options:', emailOptions);
    
    if (!emailOptions.to) {
      console.error('VALIDATION ERROR: No recipient email address');
      throw new Error('Recipient email address is required');
    }
    
    if (!emailOptions.subject) {
      console.error('VALIDATION ERROR: No email subject');
      throw new Error('Email subject is required');
    }
    
    if (!emailOptions.html && !emailOptions.text) {
      console.error('VALIDATION ERROR: No email content');
      throw new Error('Email content (html or text) is required');
    }

    // Ensure to is a string, not an object
    const recipientEmail = String(emailOptions.to);
    
    // Additional validation for email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      console.error('VALIDATION ERROR: Invalid email format:', recipientEmail);
      throw new Error(`Invalid email format: ${recipientEmail}`);
    }
    
    console.log(`✅ VALIDATION PASSED`);
    console.log(`📧 Sending email to: ${recipientEmail}`);
    console.log(`📝 Email subject: ${emailOptions.subject}`);
    console.log(`📄 Email content type: ${emailOptions.html ? 'HTML' : 'Text'}`);

    const mailOptions = {
      ...emailOptions,
      to: recipientEmail
    };

    console.log('Final mail options:', mailOptions);

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${recipientEmail}. Message ID: ${info.messageId}`);
    console.log('=== EMAIL SERVICE DEBUG END ===');
    return info;
  } catch (error) {
    console.error('=== EMAIL SERVICE ERROR ===');
    console.error(`❌ Email failed to send to ${to}:`, error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      response: error.response
    });
    console.error('=== EMAIL SERVICE ERROR END ===');
    throw new Error(`Email sending failed: ${error.message}`);
  }
}

/**
 * Send a welcome email after registration
 */
async function sendWelcomeEmail(to, name) {
  const subject = 'Welcome to FarmerAI 🌱';
  const html = `
    <h2>Welcome, ${name}!</h2>
    <p>Thank you for joining <b>FarmerAI</b>.</p>
    <p>We’re excited to help you grow smarter with AI-powered farming assistance.</p>
    <p>Happy Farming 🌾,<br/>The FarmerAI Team</p>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Send a thank-you confirmation email
 */
async function sendThankYouEmail(to, name) {
  const subject = 'Thank you for registering 🙏';
  const html = `
    <h2>Hi ${name},</h2>
    <p>We appreciate you registering with <b>FarmerAI</b>.</p>
    <p>Your account has been successfully created. Please verify your email to get started.</p>
    <p>Cheers,<br/>The FarmerAI Team</p>
  `;
  return sendEmail(to, subject, html);
}

/**
 * Generate Firebase verification link
 */
async function sendVerificationEmail(email) {
  return generateEmailVerificationLink(email);
}

/**
 * Generate Firebase password reset link
 */
async function sendPasswordResetEmail(email) {
  return generatePasswordResetLink(email);
}

/**
 * Send growth calendar task reminder email
 */
async function sendTaskReminderEmail(userEmail, userName, taskData) {
  const subject = `🌱 Reminder: ${taskData.name} for ${taskData.cropName}`;
  const dueDate = new Date(taskData.scheduledDate || taskData.date).toLocaleDateString();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #4CAF50, #8BC34A); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🌱 FarmerAI Reminder</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">Hello ${userName}!</h2>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #4CAF50;">
          <h3 style="color: #2E7D32; margin-top: 0;">📋 Task Reminder</h3>
          <p><strong>Task:</strong> ${taskData.name}</p>
          <p><strong>Crop:</strong> ${taskData.cropName}</p>
          <p><strong>Stage:</strong> ${taskData.stageName}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          ${taskData.description ? `<p><strong>Description:</strong> ${taskData.description}</p>` : ''}
          ${taskData.priority ? `<p><strong>Priority:</strong> <span style="color: ${taskData.priority === 'high' ? '#f44336' : taskData.priority === 'medium' ? '#ff9800' : '#4CAF50'};">${taskData.priority.toUpperCase()}</span></p>` : ''}
        </div>
        
        <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #2E7D32; margin-top: 0;">💡 Care Tips</h4>
          <p>Make sure to:</p>
          <ul>
            <li>Check weather conditions before performing the task</li>
            <li>Use appropriate tools and safety equipment</li>
            <li>Record any observations in your growth calendar</li>
            <li>Take photos to track progress</li>
          </ul>
        </div>
        
        <p style="color: #666; font-size: 14px; margin-top: 20px;">
          This is an automated reminder from FarmerAI. Log in to your dashboard to mark this task as completed.
        </p>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2024 FarmerAI. Growing smarter with AI-powered farming assistance.</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
}

/**
 * Send harvest countdown email
 */
async function sendHarvestCountdownEmail(userEmail, userName, calendarData) {
  const daysLeft = calendarData.remainingDaysToHarvest;
  const harvestDate = new Date(calendarData.harvestDate).toLocaleDateString();
  
  let subject, urgencyColor, urgencyText;
  
  if (daysLeft <= 0) {
    subject = `🎉 Harvest Time! ${calendarData.cropName} is ready`;
    urgencyColor = '#4CAF50';
    urgencyText = 'Ready for Harvest!';
  } else if (daysLeft <= 3) {
    subject = `⚠️ Harvest Alert: ${calendarData.cropName} ready in ${daysLeft} days`;
    urgencyColor = '#ff9800';
    urgencyText = 'Harvest Soon!';
  } else if (daysLeft <= 7) {
    subject = `📅 Harvest Countdown: ${calendarData.cropName} in ${daysLeft} days`;
    urgencyColor = '#2196F3';
    urgencyText = 'Harvest Approaching';
  } else {
    subject = `📊 Growth Update: ${calendarData.cropName} - ${daysLeft} days to harvest`;
    urgencyColor = '#9C27B0';
    urgencyText = 'Growing Well';
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${urgencyColor}, #8BC34A); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🌾 ${urgencyText}</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">Hello ${userName}!</h2>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 15px 0; text-align: center; border: 2px solid ${urgencyColor};">
          <h3 style="color: ${urgencyColor}; margin-top: 0; font-size: 28px;">
            ${daysLeft <= 0 ? '🎉' : daysLeft <= 3 ? '⚠️' : daysLeft <= 7 ? '📅' : '📊'} 
            ${daysLeft <= 0 ? 'Ready for Harvest!' : `${daysLeft} Days to Harvest`}
          </h3>
          <p style="font-size: 18px; margin: 10px 0;"><strong>Crop:</strong> ${calendarData.cropName}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Expected Harvest:</strong> ${harvestDate}</p>
          ${calendarData.variety ? `<p style="font-size: 16px; margin: 5px 0;"><strong>Variety:</strong> ${calendarData.variety}</p>` : ''}
        </div>
        
        ${daysLeft <= 0 ? `
        <div style="background: #E8F5E8; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #2E7D32; margin-top: 0;">🎉 Harvest Checklist</h4>
          <ul>
            <li>Check crop maturity indicators</li>
            <li>Prepare harvesting tools</li>
            <li>Plan harvest timing (early morning recommended)</li>
            <li>Prepare storage facilities</li>
            <li>Record actual harvest date and yield</li>
          </ul>
        </div>
        ` : daysLeft <= 3 ? `
        <div style="background: #FFF3E0; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #E65100; margin-top: 0;">⚠️ Pre-Harvest Tasks</h4>
          <ul>
            <li>Final pest and disease check</li>
            <li>Stop watering 2-3 days before harvest</li>
            <li>Prepare harvesting equipment</li>
            <li>Check weather forecast</li>
            <li>Plan harvest logistics</li>
          </ul>
        </div>
        ` : `
        <div style="background: #E3F2FD; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h4 style="color: #1976D2; margin-top: 0;">📊 Current Stage Care</h4>
          <p>Continue monitoring your crop's progress and maintain optimal growing conditions.</p>
          <ul>
            <li>Monitor soil moisture levels</li>
            <li>Check for pests and diseases</li>
            <li>Ensure proper nutrition</li>
            <li>Document growth observations</li>
          </ul>
        </div>
        `}
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/growth-calendar/${calendarData._id}" 
             style="background: ${urgencyColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Growth Calendar
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2024 FarmerAI. Growing smarter with AI-powered farming assistance.</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
}

/**
 * Send custom reminder email
 */
async function sendCustomReminderEmail(userEmail, userName, reminderData) {
  const subject = `🔔 Reminder: ${reminderData.title}`;
  const dueDate = new Date(reminderData.date).toLocaleDateString();
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #9C27B0, #E91E63); color: white; padding: 20px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">🔔 Custom Reminder</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #2E7D32; margin-top: 0;">Hello ${userName}!</h2>
        
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #9C27B0;">
          <h3 style="color: #9C27B0; margin-top: 0;">📝 Your Reminder</h3>
          <p><strong>Title:</strong> ${reminderData.title}</p>
          <p><strong>Due Date:</strong> ${dueDate}</p>
          ${reminderData.description ? `<p><strong>Description:</strong> ${reminderData.description}</p>` : ''}
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard" 
             style="background: #9C27B0; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View Dashboard
          </a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">
        <p>© 2024 FarmerAI. Growing smarter with AI-powered farming assistance.</p>
      </div>
    </div>
  `;
  
  return sendEmail(userEmail, subject, html);
}

module.exports = {
  sendEmail, // Export the generic function
  sendWelcomeEmail,
  sendThankYouEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendTaskReminderEmail,
  sendHarvestCountdownEmail,
  sendCustomReminderEmail,
};