const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const warehouseBookingController = require('../controllers/warehouse-booking-v2.controller');
const { authenticateToken: auth, requireRole: authorize } = require('../middlewares/auth.middleware');
const { ROLES } = require('../config/roles');

// Apply authentication middleware to all routes
router.use(auth);

/**
 * @route   POST /api/v2/warehouses/:warehouseId/bookings
 * @desc    Create a new warehouse booking
 * @access  Private
 */
router.post(
  '/warehouses/:warehouseId/bookings',
  [
    check('startDate', 'Start date is required').isISO8601().toDate(),
    check('endDate', 'End date is required').isISO8601().toDate(),
    check('storageType', 'Storage type is required').notEmpty(),
    check('quantity', 'Quantity must be a positive number').isFloat({ gt: 0 }),
    check('unit', 'Unit is required').isIn(['kg', 'ton', 'sqft', 'unit']),
  ],
  warehouseBookingController.createBooking
);

/**
 * @route   POST /api/v2/bookings/:bookingId/verify-payment
 * @desc    Verify payment and confirm booking
 * @access  Private
 */
router.post(
  '/bookings/:bookingId/verify-payment',
  [
    check('razorpay_payment_id', 'Payment ID is required').notEmpty(),
    check('razorpay_order_id', 'Order ID is required').notEmpty(),
    check('razorpay_signature', 'Signature is required').notEmpty(),
  ],
  warehouseBookingController.verifyBookingPayment
);

/**
 * @route   GET /api/v2/bookings
 * @desc    Get user's bookings
 * @access  Private
 */
router.get(
  '/bookings',
  [
    check('status', 'Invalid status').optional().isIn(Object.values(warehouseBookingController.BookingStatus)),
    check('page', 'Page must be a number').optional().isInt({ min: 1 }),
    check('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 100 })
  ],
  warehouseBookingController.getUserBookings
);

/**
 * @route   GET /api/v2/bookings/:bookingId
 * @desc    Get booking by ID
 * @access  Private
 */
router.get(
  '/bookings/:bookingId',
  warehouseBookingController.getBookingById
);

/**
 * @route   PUT /api/v2/bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Private
 */
router.put(
  '/bookings/:bookingId/cancel',
  [
    check('reason', 'Cancellation reason is required').notEmpty()
  ],
  warehouseBookingController.cancelBooking
);

/**
 * @route   GET /api/v2/warehouses/:warehouseId/availability
 * @desc    Get warehouse availability
 * @access  Public
 */
router.get(
  '/warehouses/:warehouseId/availability',
  [
    check('startDate', 'Start date must be a valid date').optional().isISO8601(),
    check('endDate', 'End date must be a valid date').optional().isISO8601()
  ],
  warehouseBookingController.getWarehouseAvailability
);

// Admin routes (require admin role)
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/v2/admin/bookings
 * @desc    Get all bookings (Admin only)
 * @access  Private/Admin
 */
router.get(
  '/admin/bookings',
  [
    check('status', 'Invalid status').optional().isIn(Object.values(warehouseBookingController.BookingStatus)),
    check('page', 'Page must be a number').optional().isInt({ min: 1 }),
    check('limit', 'Limit must be a number').optional().isInt({ min: 1, max: 100 }),
    check('sortBy', 'Invalid sort field').optional().isIn(['createdAt', 'bookingPeriod.startDate', 'pricing.totalAmount']),
    check('sortOrder', 'Invalid sort order').optional().isIn(['asc', 'desc'])
  ],
  warehouseBookingController.getAllBookings
);

/**
 * @route   PUT /api/v2/admin/bookings/:bookingId/status
 * @desc    Update booking status (Admin only)
 * @access  Private/Admin
 */
router.put(
  '/admin/bookings/:bookingId/status',
  [
    check('status', 'Status is required').isIn(Object.values(warehouseBookingController.BookingStatus)),
    check('notes', 'Notes must be a string').optional().isString()
  ],
  warehouseBookingController.updateBookingStatus
);

module.exports = router;
