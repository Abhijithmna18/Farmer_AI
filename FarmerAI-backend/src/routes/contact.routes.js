const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contact.controller');
const { body } = require('express-validator');
const rateLimit = require('express-rate-limit');
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');

// Rate limiting for contact form submissions
const contactRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many contact form submissions. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Validation middleware
const contactValidation = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces')
    .escape(),
  
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must be less than 100 characters')
    .normalizeEmail(),
  
  body('phone')
    .optional()
    .trim()
    .custom((value) => {
      if (!value) return true; // Optional field
      const cleaned = value.replace(/\D/g, '');
      if (cleaned.length < 10 || cleaned.length > 15) {
        throw new Error('Phone number must be between 10 and 15 digits');
      }
      return true;
    }),
  
  body('subject')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Subject must be between 3 and 100 characters')
    .escape(),
  
  body('message')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Message must be between 10 and 1000 characters')
    .escape()
];

// Contact form submission route
router.post('/', contactRateLimit, contactValidation, contactController.submitContact);

// Admin: update contact status
router.patch(
  '/:id/status',
  authenticateToken,
  requireRole(['admin']),
  contactController.updateContactStatus
);

// Admin: reply to a contact
router.post(
  '/:id/reply',
  authenticateToken,
  requireRole(['admin']),
  contactController.replyToContact
);

module.exports = router;
