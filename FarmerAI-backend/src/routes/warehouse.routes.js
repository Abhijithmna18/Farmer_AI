// src/routes/warehouse.routes.js
const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouse.controller');
const bookingController = require('../controllers/booking.controller');
const paymentController = require('../controllers/payment.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');
const authorizeRoles = require('../middlewares/role.middleware');

// Public routes (no authentication required)
router.get('/health', warehouseController.getWarehousesHealth);
router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.get('/:id/availability', warehouseController.checkAvailability);

// Protected routes (authentication required)
router.use(authenticateToken);

// Warehouse management routes (warehouse owner only)
router.post('/', authorizeRoles(['warehouse-owner']), warehouseController.createWarehouse);
router.put('/:id', authorizeRoles(['warehouse-owner']), warehouseController.updateWarehouse);
router.delete('/:id', authorizeRoles(['warehouse-owner']), warehouseController.deleteWarehouse);
router.get('/owner/my-warehouses', authorizeRoles(['warehouse-owner']), warehouseController.getOwnerWarehouses);

// Booking routes
router.post('/:id/book', warehouseController.bookWarehouse);
router.get('/bookings/my-bookings', bookingController.getBookings);
router.get('/bookings/:id', bookingController.getBookingById);
router.post('/bookings/:id/verify-payment', bookingController.verifyPayment);
router.post('/bookings/:id/approve', authorizeRoles(['warehouse-owner']), bookingController.approveBooking);
router.post('/bookings/:id/reject', authorizeRoles(['warehouse-owner']), bookingController.rejectBooking);
router.post('/bookings/:id/cancel', bookingController.cancelBooking);

// Payment routes
router.get('/payments/history', paymentController.getPaymentHistory);
router.get('/payments/:id', paymentController.getPaymentById);
router.post('/payments/webhook', paymentController.handleWebhook);

// Statistics routes
router.get('/stats/warehouses', warehouseController.getWarehouseStats);
router.get('/stats/bookings', bookingController.getBookingStats);
router.get('/stats/payments', paymentController.getPaymentStats);

module.exports = router;
