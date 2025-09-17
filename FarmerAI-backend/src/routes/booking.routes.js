const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/booking.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

// All booking routes require authentication
router.use(authenticateToken);

// Create a new booking (farmer only)
router.post('/', bookingController.createBooking);

// Get bookings for the authenticated user
router.get('/', bookingController.getBookings);

// Get booking by ID
router.get('/:id', bookingController.getBookingById);

// Verify payment
router.post('/verify-payment', bookingController.verifyPayment);

// Approve booking (warehouse owner only)
router.patch('/:id/approve', bookingController.approveBooking);

// Reject booking (warehouse owner only)
router.patch('/:id/reject', bookingController.rejectBooking);

// Cancel booking (farmer only)
router.patch('/:id/cancel', bookingController.cancelBooking);

// Get booking statistics
router.get('/stats/summary', bookingController.getBookingStats);

// Get owner revenue
router.get('/stats/revenue', bookingController.getOwnerRevenue);

module.exports = router;


