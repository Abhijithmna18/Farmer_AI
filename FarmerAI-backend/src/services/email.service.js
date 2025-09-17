// src/services/email.service.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const EmailLog = require('../models/EmailLog');

// Create transporter
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  const base = {
    host,
    port,
    secure,
  };

  if (user && pass) {
    return nodemailer.createTransport({
      ...base,
      auth: { user, pass }
    });
  }

  // If creds missing, still create transport (e.g., local mailcatcher) but log a warning
  logger.warn('SMTP credentials are missing. Emails may fail to send.');
  return nodemailer.createTransport(base);
};

// Email templates
const emailTemplates = {
  bookingConfirmation: (data) => ({
    subject: `Booking Confirmation - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Booking Confirmed!</h2>
        <p>Dear ${data.farmerName},</p>
        <p>Your warehouse booking has been confirmed successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Location:</strong> ${data.warehouseLocation}</p>
          <p><strong>Storage Type:</strong> ${data.storageType}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
          <p><strong>Duration:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Total Amount:</strong> ₹${data.totalAmount}</p>
        </div>
        
        <p>You will receive another email once the warehouse owner approves your booking.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  paymentConfirmation: (data) => ({
    subject: `Payment Confirmed - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Payment Successful!</h2>
        <p>Dear ${data.farmerName},</p>
        <p>Your payment has been processed successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Payment Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Payment ID:</strong> ${data.paymentId}</p>
          <p><strong>Amount Paid:</strong> ₹${data.amount}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
          <p><strong>Transaction Date:</strong> ${data.paymentDate}</p>
        </div>
        
        <p>Your booking is now awaiting warehouse owner approval.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  bookingApproved: (data) => ({
    subject: `Booking Approved - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Booking Approved!</h2>
        <p>Dear ${data.farmerName},</p>
        <p>Great news! Your warehouse booking has been approved by the warehouse owner.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Owner:</strong> ${data.ownerName}</p>
          <p><strong>Contact:</strong> ${data.ownerPhone}</p>
          <p><strong>Storage Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
        </div>
        
        <p>Please contact the warehouse owner for any specific instructions or requirements.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  bookingRejected: (data) => ({
    subject: `Booking Rejected - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">Booking Rejected</h2>
        <p>Dear ${data.farmerName},</p>
        <p>Unfortunately, your warehouse booking has been rejected by the warehouse owner.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
        </div>
        
        <p>Your payment will be refunded within 3-5 business days.</p>
        <p>You can try booking another warehouse or contact our support team for assistance.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  refundProcessed: (data) => ({
    subject: `Refund Processed - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Refund Processed</h2>
        <p>Dear ${data.farmerName},</p>
        <p>Your refund has been processed successfully.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Refund Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Refund Amount:</strong> ₹${data.refundAmount}</p>
          <p><strong>Refund Date:</strong> ${data.refundDate}</p>
          <p><strong>Reason:</strong> ${data.refundReason}</p>
        </div>
        
        <p>The refund will be credited to your original payment method within 3-5 business days.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  newBookingNotification: (data) => ({
    subject: `New Booking Request - ${data.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">New Booking Request</h2>
        <p>Dear ${data.ownerName},</p>
        <p>You have received a new booking request for your warehouse.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Farmer:</strong> ${data.farmerName}</p>
          <p><strong>Contact:</strong> ${data.farmerPhone}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
          <p><strong>Storage Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Amount:</strong> ₹${data.totalAmount}</p>
        </div>
        
        <p>Please log in to your dashboard to approve or reject this booking.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const transporter = createTransporter();
    const emailTemplate = emailTemplates[template];
    
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const emailContent = emailTemplate(data);
    
    const mailOptions = {
      from: `"FarmerAI" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@farmerai.local'}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const result = await transporter.sendMail(mailOptions);
    
    // Log email
    await EmailLog.create({
      to,
      subject: emailContent.subject,
      body: emailContent.html,
      template,
      status: 'success',
      messageId: result.messageId,
      data
    });

    logger.info(`Email sent successfully to ${to}: ${template}`);
    return result;
  } catch (error) {
    // Log failed email
    // Attempt to include body if template is available
    let subjectFallback = 'Unknown';
    let bodyFallback = '';
    try {
      const tmpl = emailTemplates[template];
      if (tmpl) {
        const content = tmpl(data || {});
        subjectFallback = content.subject || subjectFallback;
        bodyFallback = content.html || bodyFallback;
      }
    } catch (_) {}

    await EmailLog.create({
      to,
      subject: subjectFallback,
      body: bodyFallback,
      template,
      status: 'failed',
      error: error.message,
      data
    });

    logger.error(`Failed to send email to ${to}: ${error.message}`);
    throw error;
  }
};

// Send a raw email with explicit subject and HTML (no template lookup)
const sendRawEmail = async (to, subject, html) => {
  try {
    const transporter = createTransporter();
    const mailOptions = {
      from: `"FarmerAI" <${process.env.SMTP_FROM || process.env.SMTP_USER || 'no-reply@farmerai.local'}>`,
      to,
      subject,
      html
    };

    const result = await transporter.sendMail(mailOptions);

    await EmailLog.create({
      to,
      subject,
      body: html || '',
      template: 'raw',
      status: 'success',
      messageId: result.messageId
    });

    logger.info(`Email sent successfully to ${to}: ${subject}`);
    return result;
  } catch (error) {
    await EmailLog.create({
      to,
      subject,
      body: html || '',
      template: 'raw',
      status: 'failed',
      error: error.message
    });
    logger.error(`Failed to send raw email to ${to}: ${error.message}`);
    throw error;
  }
};

// Send booking confirmation email
const sendBookingConfirmation = async (farmerEmail, bookingData) => {
  return sendEmail(farmerEmail, 'bookingConfirmation', bookingData);
};

// Send payment confirmation email
const sendPaymentConfirmation = async (farmerEmail, paymentData) => {
  return sendEmail(farmerEmail, 'paymentConfirmation', paymentData);
};

// Send booking approved email
const sendBookingApproved = async (farmerEmail, bookingData) => {
  return sendEmail(farmerEmail, 'bookingApproved', bookingData);
};

// Send booking rejected email
const sendBookingRejected = async (farmerEmail, bookingData) => {
  return sendEmail(farmerEmail, 'bookingRejected', bookingData);
};

// Send refund processed email
const sendRefundProcessed = async (farmerEmail, refundData) => {
  return sendEmail(farmerEmail, 'refundProcessed', refundData);
};

// Send new booking notification to warehouse owner
const sendNewBookingNotification = async (ownerEmail, bookingData) => {
  return sendEmail(ownerEmail, 'newBookingNotification', bookingData);
};

// Send booking confirmation to admin
const sendBookingConfirmationToAdmin = async (adminEmail, bookingData) => {
  const template = {
    subject: `New Warehouse Booking - ${bookingData.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">New Warehouse Booking</h2>
        <p>Dear Admin,</p>
        <p>A new warehouse booking has been created and requires your attention.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
          <p><strong>Farmer:</strong> ${bookingData.farmerName}</p>
          <p><strong>Warehouse:</strong> ${bookingData.warehouseName}</p>
          <p><strong>Owner:</strong> ${bookingData.ownerName}</p>
          <p><strong>Location:</strong> ${bookingData.warehouseLocation}</p>
          <p><strong>Produce:</strong> ${bookingData.produceType} (${bookingData.quantity} ${bookingData.unit})</p>
          <p><strong>Duration:</strong> ${bookingData.startDate} to ${bookingData.endDate}</p>
          <p><strong>Total Amount:</strong> ₹${bookingData.totalAmount}</p>
          <p><strong>Payment Status:</strong> ${bookingData.paymentStatus}</p>
        </div>
        
        <p>Please review this booking in the admin dashboard.</p>
        <p>Best regards,<br>FarmerAI Team</p>
      </div>
    `
  };
  
  return sendRawEmail(adminEmail, template.subject, template.html);
};

// Send booking confirmation to warehouse owner
const sendBookingConfirmationToOwner = async (ownerEmail, bookingData) => {
  const template = {
    subject: `New Booking Request - ${bookingData.bookingId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">New Booking Request</h2>
        <p>Dear ${bookingData.ownerName},</p>
        <p>You have received a new booking request for your warehouse.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${bookingData.bookingId}</p>
          <p><strong>Farmer:</strong> ${bookingData.farmerName}</p>
          <p><strong>Contact:</strong> ${bookingData.farmerEmail} | ${bookingData.farmerPhone || 'N/A'}</p>
          <p><strong>Warehouse:</strong> ${bookingData.warehouseName}</p>
          <p><strong>Produce:</strong> ${bookingData.produceType} (${bookingData.quantity} ${bookingData.unit})</p>
          <p><strong>Duration:</strong> ${bookingData.startDate} to ${bookingData.endDate}</p>
          <p><strong>Total Amount:</strong> ₹${bookingData.totalAmount}</p>
          <p><strong>Payment Status:</strong> ${bookingData.paymentStatus}</p>
          ${bookingData.notes ? `<p><strong>Notes:</strong> ${bookingData.notes}</p>` : ''}
        </div>
        
        <p>Please review and approve/reject this booking in your dashboard.</p>
        <p>Best regards,<br>FarmerAI Team</p>
      </div>
    `
  };
  
  return sendRawEmail(ownerEmail, template.subject, template.html);
};

module.exports = {
  sendEmail,
  sendRawEmail,
  sendBookingConfirmation,
  sendPaymentConfirmation,
  sendBookingApproved,
  sendBookingRejected,
  sendRefundProcessed,
  sendNewBookingNotification,
  sendBookingConfirmationToAdmin,
  sendBookingConfirmationToOwner
};