// src/controllers/booking.controller.js
const Booking = require('../models/Booking');
const Warehouse = require('../models/Warehouse');
const User = require('../models/User');
const Payment = require('../models/Payment');
const { verifyPayment: verifyRazorpayPayment, createRefund } = require('../config/razorpay');
const {
  sendPaymentConfirmation,
  sendBookingApproved,
  sendBookingRejected,
  sendRefundProcessed
} = require('../services/email.service');
const logger = require('../utils/logger');

// Get all bookings for a user (farmer or warehouse owner)
const getBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const {
      page = 1,
      limit = 10,
      status,
      dateFrom,
      dateTo
    } = req.query;

    let query = {};
    
    if (userRole === 'farmer') {
      query.farmer = userId;
    } else if (userRole === 'warehouse-owner') {
      query.warehouseOwner = userId;
    }

    if (status) {
      query.status = status;
    }

    if (dateFrom || dateTo) {
      query['bookingDates.startDate'] = {};
      if (dateFrom) query['bookingDates.startDate'].$gte = new Date(dateFrom);
      if (dateTo) query['bookingDates.startDate'].$lte = new Date(dateTo);
    }

    const bookings = await Booking.find(query)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location')
      .populate('warehouseOwner', 'firstName lastName email phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone farmerProfile')
      .populate('warehouse', 'name location facilities images')
      .populate('warehouseOwner', 'firstName lastName email phone warehouseOwnerProfile');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if user has permission to view this booking
    const canView = userRole === 'admin' || 
                   booking.farmer._id.toString() === userId || 
                   booking.warehouseOwner._id.toString() === userId;

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    logger.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// Verify payment and update booking status
const verifyPayment = async (req, res) => {
  try {
    const { bookingId, paymentId, signature } = req.body;

    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment signature
    const isValidPayment = verifyRazorpayPayment(booking.payment.razorpayOrderId, paymentId, signature);
    if (!isValidPayment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update booking status
    booking.status = 'awaiting-approval';
    booking.payment.status = 'paid';
    booking.payment.razorpayPaymentId = paymentId;
    booking.payment.razorpaySignature = signature;
    booking.payment.paidAt = new Date();

    await booking.save();

    // Create payment record
    const payment = new Payment({
      paymentId: Payment.generatePaymentId(),
      booking: booking._id,
      farmer: booking.farmer,
      warehouseOwner: booking.warehouseOwner,
      amount: {
        total: booking.pricing.totalAmount,
        baseAmount: booking.pricing.basePrice,
        platformFee: booking.pricing.platformFee,
        ownerAmount: booking.pricing.ownerAmount,
        currency: booking.pricing.currency
      },
      razorpay: {
        orderId: booking.payment.razorpayOrderId,
        paymentId,
        signature,
        status: 'paid',
        captured: true
      },
      status: 'completed'
    });

    await payment.save();

    // Send payment confirmation email
    try {
      const farmer = await User.findById(booking.farmer);
      await sendPaymentConfirmation(farmer.email, {
        farmerName: farmer.firstName + ' ' + farmer.lastName,
        bookingId: booking.bookingId,
        paymentId,
        amount: booking.pricing.totalAmount,
        paymentMethod: 'Razorpay',
        paymentDate: new Date().toLocaleDateString()
      });
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email:', emailError);
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

// Approve booking (warehouse owner only)
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { notes } = req.body;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.warehouseOwner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to approve this booking'
      });
    }

    if (booking.status !== 'awaiting-approval') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in awaiting approval status'
      });
    }

    // Update booking status
    booking.status = 'approved';
    booking.approval.status = 'approved';
    booking.approval.approvedAt = new Date();
    booking.approval.approvedBy = userId;
    booking.approval.notes = notes;

    await booking.save();

    // Send approval email to farmer
    try {
      await sendBookingApproved(booking.farmer.email, {
        farmerName: booking.farmer.firstName + ' ' + booking.farmer.lastName,
        bookingId: booking.bookingId,
        warehouseName: booking.warehouse.name,
        ownerName: req.user.firstName + ' ' + req.user.lastName,
        ownerPhone: req.user.phone,
        produceType: booking.produce.type,
        quantity: booking.produce.quantity,
        unit: booking.produce.unit,
        startDate: booking.bookingDates.startDate,
        endDate: booking.bookingDates.endDate
      });
    } catch (emailError) {
      logger.error('Failed to send approval email:', emailError);
    }

    res.json({
      success: true,
      message: 'Booking approved successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error approving booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve booking',
      error: error.message
    });
  }
};

// Reject booking (warehouse owner only)
const rejectBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason, notes } = req.body;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.warehouseOwner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to reject this booking'
      });
    }

    if (booking.status !== 'awaiting-approval') {
      return res.status(400).json({
        success: false,
        message: 'Booking is not in awaiting approval status'
      });
    }

    // Update booking status
    booking.status = 'rejected';
    booking.approval.status = 'rejected';
    booking.approval.rejectedAt = new Date();
    booking.approval.approvedBy = userId;
    booking.approval.rejectionReason = reason;
    booking.approval.notes = notes;

    await booking.save();

    // Process refund
    try {
      const refund = await createRefund(
        booking.payment.razorpayPaymentId,
        booking.pricing.totalAmount,
        { reason: 'Booking rejected by warehouse owner' }
      );

      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
      booking.payment.refundAmount = booking.pricing.totalAmount;
      booking.payment.refundReason = reason;
      await booking.save();

      // Send rejection email to farmer
      await sendBookingRejected(booking.farmer.email, {
        farmerName: booking.farmer.firstName + ' ' + booking.farmer.lastName,
        bookingId: booking.bookingId,
        warehouseName: booking.warehouse.name,
        rejectionReason: reason
      });

      // Send refund email
      await sendRefundProcessed(booking.farmer.email, {
        farmerName: booking.farmer.firstName + ' ' + booking.farmer.lastName,
        bookingId: booking.bookingId,
        refundAmount: booking.pricing.totalAmount,
        refundDate: new Date().toLocaleDateString(),
        refundReason: 'Booking rejected by warehouse owner'
      });
    } catch (refundError) {
      logger.error('Failed to process refund:', refundError);
    }

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error rejecting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject booking',
      error: error.message
    });
  }
};

// Cancel booking (farmer only)
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const booking = await Booking.findById(id)
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouse', 'name location');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.farmer._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this booking'
      });
    }

    if (!booking.canBeCancelled) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be cancelled at this time'
      });
    }

    // Calculate refund amount
    const refundAmount = booking.calculateRefund();

    // Update booking status
    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt: new Date(),
      cancelledBy: userId,
      reason,
      refundEligible: refundAmount > 0,
      refundAmount
    };

    await booking.save();

    // Process refund if applicable
    if (refundAmount > 0) {
      try {
        await createRefund(
          booking.payment.razorpayPaymentId,
          refundAmount,
          { reason: 'Booking cancelled by farmer' }
        );

        booking.payment.status = 'refunded';
        booking.payment.refundedAt = new Date();
        booking.payment.refundAmount = refundAmount;
        booking.payment.refundReason = reason;
        await booking.save();

        // Send refund email
        await sendRefundProcessed(booking.farmer.email, {
          farmerName: booking.farmer.firstName + ' ' + booking.farmer.lastName,
          bookingId: booking.bookingId,
          refundAmount,
          refundDate: new Date().toLocaleDateString(),
          refundReason: reason
        });
      } catch (refundError) {
        logger.error('Failed to process refund:', refundError);
      }
    }

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: error.message
    });
  }
};

// Get booking statistics
const getBookingStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { dateFrom, dateTo } = req.query;

    const filters = {};
    if (userRole === 'farmer') {
      filters.farmer = userId;
    } else if (userRole === 'warehouse-owner') {
      filters.warehouseOwner = userId;
    }

    if (dateFrom) filters.dateFrom = dateFrom;
    if (dateTo) filters.dateTo = dateTo;

    const stats = await Booking.getStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching booking stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking statistics',
      error: error.message
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  verifyPayment,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getBookingStats
};
