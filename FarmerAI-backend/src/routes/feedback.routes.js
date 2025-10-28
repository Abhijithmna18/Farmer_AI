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

// User analytics and notifications (MUST come before /:id route)
router.get('/analytics', feedbackController.getFeedbackAnalytics);
router.get('/notifications', feedbackController.getFeedbackNotifications);

// Get single feedback by ID (MUST come after specific routes)
router.get('/:id', feedbackController.getFeedbackById);

// Admin routes
router.get('/admin/all', requireRole(['admin']), feedbackController.getAllFeedback);
router.get('/admin/stats', requireRole(['admin']), feedbackController.getFeedbackStats);
router.get('/admin/analytics', requireRole(['admin']), feedbackController.getAdminFeedbackAnalytics);
router.get('/admin/notifications', requireRole(['admin']), feedbackController.getAdminFeedbackNotifications);
router.put('/admin/:id', requireRole(['admin']), feedbackController.updateFeedback);
router.delete('/admin/:id', requireRole(['admin']), feedbackController.deleteFeedback);

module.exports = router;



