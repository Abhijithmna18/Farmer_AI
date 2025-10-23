const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const adminReconcileController = require('../controllers/admin-reconcile.controller');
const authorizeRoles = require('../middlewares/role.middleware');
const { authenticateToken } = require('../middlewares/auth.middleware'); // Assuming you have an auth middleware for JWT protection

// All admin routes should be protected and require admin role
router.use(authenticateToken);
router.use(authorizeRoles(['admin']));

// Overview & Stats
router.get('/overview', adminController.getOverviewStats);
router.get('/stats', adminController.getOverviewStats); // alias for frontend
// Analytics
router.get('/analytics', adminController.getAnalytics);
router.get('/reports', adminController.getReports);

// Users (admin can read, modify, and delete)
router.get('/users', authorizeRoles(['admin']), adminController.getUsers);
router.patch('/users/:id', authorizeRoles(['admin']), adminController.updateUserRole); // update role/verify
router.delete('/users/:id', authorizeRoles(['admin']), adminController.deleteUser);

// Events
router.get('/events', adminController.getEvents);
router.post('/events', adminController.createEvent);
router.put('/events/:eventId', adminController.updateEvent);
router.patch('/events/:eventId/approve', adminController.approveEvent);
router.patch('/events/:eventId/reject', adminController.rejectEvent);
// unified: PATCH /api/admin/events/:eventId/verify { status: 'verified' | 'rejected' }
router.patch('/events/:eventId/verify', adminController.verifyOrRejectEvent);
router.delete('/events/:eventId', adminController.deleteEvent);

// Contacts
router.get('/contacts', adminController.getContacts);
router.get('/messages', adminController.getContacts); // alias
router.delete('/contacts/:id', adminController.deleteContact);

// Registrations
router.get('/registrations', adminController.getRegistrations);

// Email Logs
router.get('/email-logs', adminController.getEmailLogs);
router.patch('/email-logs/:logId/retry', adminController.retryEmail);

// Warehouse Management
router.get('/warehouses', adminController.getWarehouses);
router.post('/warehouses', adminController.createWarehouse);
router.get('/warehouses/:id', adminController.getWarehouseById);
router.patch('/warehouses/:id', adminController.updateWarehouse);
router.patch('/warehouses/:id/verify', adminController.verifyWarehouse);
router.delete('/warehouses/:id', adminController.deleteWarehouse);

// Booking Management
router.get('/bookings', adminController.getBookings);
router.post('/bookings', adminController.createBooking);
router.get('/bookings/:id', adminController.getBookingById);
router.patch('/bookings/:id/status', adminController.updateBookingStatus);
router.post('/bookings/bulk-reconcile', adminReconcileController.bulkReconcileBookings);

// Payment Management
router.get('/payments', adminController.getPayments);
router.get('/payments/:id', adminController.getPaymentById);
router.post('/payments/:id/refund', adminController.processRefund);

// Growth Calendar Management
router.get('/growth-calendar', adminController.getGrowthCalendars);
router.get('/growth-calendar/meta', adminController.getGrowthCalendarMeta);
router.post('/growth-calendar', adminController.createGrowthCalendar);
router.get('/growth-calendar/:id', adminController.getGrowthCalendarById);
router.put('/growth-calendar/:id', adminController.updateGrowthCalendar);
router.delete('/growth-calendar/:id', adminController.deleteGrowthCalendar);
router.post('/growth-calendar/:id/remind', adminController.remindGrowthCalendar);

// Analytics
router.get('/analytics/warehouses', adminController.getWarehouseAnalytics);
router.get('/analytics/bookings', adminController.getBookingAnalytics);
router.get('/analytics/payments', adminController.getPaymentAnalytics);

// Notifications
router.get('/notifications', adminController.getNotifications);
router.patch('/notifications/:id/read', adminController.markNotificationAsRead);
router.patch('/notifications/read-all', adminController.markAllNotificationsAsRead);
router.delete('/notifications/:id', adminController.deleteNotification);

// Admin Settings
router.get('/settings/preferences', adminController.getAdminPreferences);
router.put('/settings/preferences', adminController.updateAdminPreferences);
router.get('/settings/system', adminController.getSystemConfiguration);
router.put('/settings/system', adminController.updateSystemConfiguration);
router.get('/settings/environment', adminController.getEnvironmentConfiguration);
router.put('/settings/environment', adminController.updateEnvironmentConfiguration);
router.get('/settings/logs', adminController.getConfigurationLogs);
router.post('/settings/restore-defaults', adminController.restoreDefaultConfiguration);

module.exports = router;