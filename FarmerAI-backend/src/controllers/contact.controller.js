const Contact = require('../models/Contact');
const emailService = require('../services/email.service');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// Submit contact form
exports.submitContact = async (req, res) => {
  try {
    // Check validation results
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, phone, subject, message } = req.body;

    // Create contact record
    const contact = new Contact({
      name,
      email,
      phone: phone || undefined, // Only save if provided
      subject,
      message,
      status: 'new'
    });

    await contact.save();

    // Send confirmation email to user
    try {
      await emailService.sendEmail(email, 'contactConfirmation', {
        name,
        subject,
        message
      });
    } catch (emailError) {
      logger.error('Failed to send confirmation email:', emailError);
      // Don't fail the request if email fails
    }

    // Send alert email to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
      if (adminEmail) {
        await emailService.sendEmail(adminEmail, 'contactAlert', {
          name,
          email,
          phone: phone || 'Not provided',
          subject,
          message,
          contactId: contact._id,
          timestamp: new Date().toLocaleString()
        });
      }
    } catch (emailError) {
      logger.error('Failed to send admin alert email:', emailError);
      // Don't fail the request if email fails
    }

    logger.info(`Contact form submitted by ${name} (${email})`);

    res.status(201).json({
      success: true,
      message: 'Thank you for your message! We\'ll get back to you soon.',
      contactId: contact._id
    });

  } catch (error) {
    logger.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit your message. Please try again later.'
    });
  }
};

// Get contact by ID (for admin)
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    logger.error('Error fetching contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact message'
    });
  }
};

// Update contact status (for admin)
exports.updateContactStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['new', 'read', 'archived'];
    
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: new, read, archived'
      });
    }

    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Contact status updated successfully',
      contact
    });
  } catch (error) {
    logger.error('Error updating contact status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact status'
    });
  }
};

// Reply to contact (for admin)
exports.replyToContact = async (req, res) => {
  try {
    const { replyMessage } = req.body;
    
    if (!replyMessage || replyMessage.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reply message must be at least 10 characters'
      });
    }

    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact message not found'
      });
    }

    // Send reply email (do not fail the whole request if email fails)
    try {
      await emailService.sendEmail(contact.email, 'contactReply', {
        name: contact.name,
        originalSubject: contact.subject,
        originalMessage: contact.message,
        replyMessage: replyMessage.trim()
      });
    } catch (emailErr) {
      logger.error('Email send failed for contact reply:', emailErr);
      // Continue without throwing to avoid 500 on UI
    }

    // Update contact status to read
    contact.status = 'read';
    await contact.save();

    logger.info(`Reply sent to contact ${contact._id} from ${contact.email}`);

    res.status(200).json({
      success: true,
      message: 'Reply processed successfully'
    });

  } catch (error) {
    logger.error('Error replying to contact:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reply'
    });
  }
};
