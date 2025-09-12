const express = require('express');
const router = express.Router();
const controller = require('../controllers/settings.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Preferences routes
router.get('/preferences', controller.getPreferences);
router.put('/preferences', controller.updatePreferences);

// Security routes
router.put('/password', controller.changePassword);
router.get('/login-history', controller.getLoginHistory);
router.post('/login-history', controller.addLoginEntry);

// Notification routes
router.get('/notifications', controller.getNotificationPreferences);
router.put('/notifications', controller.updateNotificationPreferences);
router.post('/notifications/test', controller.sendTestNotification);

// Profile routes
router.put('/profile', controller.updateProfile);

// Account deletion
router.delete('/account', controller.deleteAccount);

module.exports = router;








