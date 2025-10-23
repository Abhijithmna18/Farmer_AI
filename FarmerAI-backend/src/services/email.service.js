// src/services/email.service.js
const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const EmailLog = require('../models/EmailLog');

// Create transporter
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = Number(process.env.EMAIL_PORT || 587);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;
  const user = process.env.EMAIL_USER || '';
  const pass = process.env.EMAIL_PASS || '';

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

  // If creds missing, fallback to JSON transport to avoid network failures in dev
  logger.warn('SMTP credentials are missing. Using JSON transport (emails will be logged, not sent).');
  return nodemailer.createTransport({ jsonTransport: true });
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
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Storage Period:</strong> ${data.startDate} to ${data.endDate}</p>
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
        <p>Great news! Your warehouse booking has been approved by the <strong>FarmerAI Admin</strong>. Your warehouse access is now active for the approved period.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          ${data.ownerName ? `<p><strong>Owner:</strong> ${data.ownerName}</p>` : ''}
          ${data.ownerPhone ? `<p><strong>Contact:</strong> ${data.ownerPhone}</p>` : ''}
          <p><strong>Storage Period:</strong> ${data.startDate} to ${data.endDate}</p>
          <p><strong>Produce:</strong> ${data.produceType} (${data.quantity} ${data.unit})</p>
        </div>
        
        <p>Please reach out to support if you need assistance or have specific instructions.</p>
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
        <p>Unfortunately, your warehouse booking has been <strong>rejected by the FarmerAI Admin</strong>.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details</h3>
          <p><strong>Booking ID:</strong> ${data.bookingId}</p>
          <p><strong>Warehouse:</strong> ${data.warehouseName}</p>
          <p><strong>Reason:</strong> ${data.rejectionReason}</p>
        </div>
        
        <p>If a payment was captured, any eligible refund will be processed within 3-5 business days.</p>
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
  }),

  warehouseApproved: (data) => ({
    subject: `Warehouse Approved - ${data.warehouseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">🎉 Warehouse Approved!</h2>
        <p>Dear ${data.ownerName},</p>
        <p>Great news! Your warehouse listing has been approved and is now live on our platform.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Warehouse Details</h3>
          <p><strong>Warehouse Name:</strong> ${data.warehouseName}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Storage Types:</strong> ${data.storageTypes}</p>
          <p><strong>Capacity:</strong> ${data.capacity}</p>
          <p><strong>Price:</strong> ₹${data.price}</p>
          <p><strong>Approved On:</strong> ${data.approvedDate}</p>
        </div>
        
        <p>Your warehouse is now visible to farmers and ready to receive booking requests!</p>
        <p>You can manage your warehouse and view bookings in your dashboard.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  warehouseRejected: (data) => ({
    subject: `Warehouse Listing Update - ${data.warehouseName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Warehouse Listing Update</h2>
        <p>Dear ${data.ownerName},</p>
        <p>We have reviewed your warehouse listing and unfortunately, it requires some modifications before it can be approved.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3>Warehouse Details</h3>
          <p><strong>Warehouse Name:</strong> ${data.warehouseName}</p>
          <p><strong>Location:</strong> ${data.location}</p>
          <p><strong>Review Date:</strong> ${data.reviewDate}</p>
          <p><strong>Reason:</strong> ${data.reason}</p>
        </div>
        
        <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Next Steps</h3>
          <p>Please review the feedback and make the necessary changes:</p>
          <ul>
            <li>Update your warehouse information as requested</li>
            <li>Ensure all required documents are uploaded</li>
            <li>Verify contact information is accurate</li>
            <li>Resubmit your listing for review</li>
          </ul>
        </div>
        
        <p>If you have any questions, please contact our support team.</p>
        <p>Thank you for using FarmerAI!</p>
      </div>
    `
  }),

  contactConfirmation: (data) => ({
    subject: `We received your message - ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Thank you for contacting us!</h2>
        <p>Dear ${data.name},</p>
        <p>We have received your message and will get back to you as soon as possible.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Message Details</h3>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Message:</strong></p>
          <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #2d5016;">
            ${data.message}
          </p>
        </div>
        
        <p>Our team typically responds within 24 hours. For urgent matters, please call us at +1 (555) 555-5556.</p>
        <p>Thank you for choosing FarmerAI!</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
          <p>This is an automated confirmation. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }),

  contactAlert: (data) => ({
    subject: `New Contact Form Submission - ${data.subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">New Contact Form Submission</h2>
        <p>A new message has been received through the contact form.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Contact Details</h3>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Subject:</strong> ${data.subject}</p>
          <p><strong>Submitted:</strong> ${data.timestamp}</p>
          <p><strong>Contact ID:</strong> ${data.contactId}</p>
        </div>
        
        <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
          <h3>Message</h3>
          <p style="background-color: white; padding: 15px; border-radius: 4px;">
            ${data.message}
          </p>
        </div>
        
        <div style="margin-top: 20px;">
          <p><strong>Action Required:</strong> Please respond to this inquiry within 24 hours.</p>
          <p>You can reply directly to this email or use the admin dashboard to manage this contact.</p>
        </div>
      </div>
    `
  }),

  contactReply: (data) => ({
    subject: `Re: ${data.originalSubject}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d5016;">Response from FarmerAI Team</h2>
        <p>Dear ${data.name},</p>
        <p>Thank you for contacting us. Here's our response to your inquiry:</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Original Message</h3>
          <p><strong>Subject:</strong> ${data.originalSubject}</p>
          <p style="background-color: white; padding: 15px; border-radius: 4px; border-left: 4px solid #6c757d;">
            ${data.originalMessage}
          </p>
        </div>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Our Response</h3>
          <p style="background-color: white; padding: 15px; border-radius: 4px;">
            ${data.replyMessage}
          </p>
        </div>
        
        <p>If you have any further questions, please don't hesitate to contact us again.</p>
        <p>Best regards,<br>The FarmerAI Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
          <p>This email was sent in response to your contact form submission.</p>
        </div>
      </div>
    `
  }),

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
          <p><strong>Platform Fee (5%):</strong> ₹${bookingData.platformFee || 0}</p>
          <p><strong>Owner Amount:</strong> ₹${bookingData.ownerAmount || 0}</p>
          <p><strong>Payment Status:</strong> ${bookingData.paymentStatus}</p>
        </div>
        
        <div style="background-color: #e8f4e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Revenue Analysis</h3>
          <p><strong>Booking Value:</strong> ₹${bookingData.totalAmount}</p>
          <p><strong>Platform Revenue:</strong> ₹${bookingData.platformFee || 0}</p>
          <p><strong>Owner Payout:</strong> ₹${bookingData.ownerAmount || 0}</p>
        </div>
        
        ${bookingData.invoiceUrl ? `<p><a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}${bookingData.invoiceUrl}" style="background-color: #2d5016; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Invoice</a></p>` : ''}
        
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

// Send warehouse approval notification
const sendWarehouseApproved = async (ownerEmail, warehouseData) => {
  return sendEmail(ownerEmail, 'warehouseApproved', warehouseData);
};

// Send warehouse rejection notification
const sendWarehouseRejected = async (ownerEmail, warehouseData) => {
  return sendEmail(ownerEmail, 'warehouseRejected', warehouseData);
};

// Send warehouse booking reminder email
const sendWarehouseBookingReminder = async (farmerEmail, bookingData) => {
  return sendEmail(farmerEmail, 'warehouseBookingReminder', bookingData);
};

// Send warehouse owner reminder email
const sendWarehouseOwnerReminder = async (ownerEmail, bookingData) => {
  return sendEmail(ownerEmail, 'warehouseOwnerReminder', bookingData);
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
  sendBookingConfirmationToOwner,
  sendWarehouseApproved,
  sendWarehouseRejected,
  sendWarehouseBookingReminder, // Added export
  sendWarehouseOwnerReminder    // Added export
};