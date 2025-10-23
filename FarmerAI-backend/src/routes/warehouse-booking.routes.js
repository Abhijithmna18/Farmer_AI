// src/routes/warehouse-booking.routes.js
const express = require('express');
const router = express.Router();
const {
  createBooking,
  getUserBookings,
  getBookingById,
  verifyPayment,
  cancelBooking,
  getWarehouseAvailability,
  reconcileBooking
} = require('../controllers/warehouse-booking.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Create a new booking
router.post('/book', createBooking);

// Get user's bookings
router.get('/my-bookings', getUserBookings);

// Get booking by ID
router.get('/:id', getBookingById);

// Verify payment
router.post('/verify-payment', verifyPayment);

// Cancel booking
router.post('/:id/cancel', cancelBooking);

// Reconcile booking values and return fresh record
router.get('/:id/reconcile', reconcileBooking);

// Get warehouse availability (public route)
router.get('/warehouse/:id/availability', getWarehouseAvailability);

module.exports = router;


