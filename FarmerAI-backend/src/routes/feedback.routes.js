const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middlewares/auth.middleware');
const feedbackController = require('../controllers/feedback.controller');

// All routes require authentication
router.use(authenticateToken);

// Create feedback (Farmer's action)
router.post('/', feedbackController.upload.single('attachment'), feedbackController.createFeedback);

// Get user's own feedback (Farmer's view)
router.get('/user', feedbackController.getUserFeedback);

// Get single feedback by ID
router.get('/:id', feedbackController.getFeedbackById);

// Admin routes
router.get('/admin/all', requireRole(['admin']), feedbackController.getAllFeedback);
router.get('/admin/stats', requireRole(['admin']), feedbackController.getFeedbackStats);
router.put('/admin/:id', requireRole(['admin']), feedbackController.updateFeedback);
router.delete('/admin/:id', requireRole(['admin']), feedbackController.deleteFeedback);

module.exports = router;



