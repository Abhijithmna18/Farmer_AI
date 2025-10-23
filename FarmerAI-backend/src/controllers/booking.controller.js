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
  sendRefundProcessed,
  sendBookingConfirmationToAdmin,
  sendBookingConfirmationToOwner
} = require('../services/email.service');
const logger = require('../utils/logger');
const { emitBookingEvent, emitWarehouseEvent } = require('../services/realtime.service');

// Create a new booking
const createBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      warehouseId,
      produceType,
      quantity,
      startDate,
      endDate,
      notes,
      duration
    } = req.body;

    // Validate required fields
    if (!warehouseId || !produceType || !quantity || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: warehouseId, produceType, quantity, startDate, endDate'
      });
    }

    // Get warehouse details
    const warehouse = await Warehouse.findById(warehouseId)
      .populate('owner', 'firstName lastName email phone');

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check if warehouse is active
    if (warehouse.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Warehouse is not available for booking'
      });
    }

    // Calculate duration if not provided
    const calculatedDuration = duration || Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
    
    // Calculate pricing
    const basePrice = warehouse.pricing?.basePrice || 0;
    const totalAmount = basePrice * calculatedDuration * quantity;
    const platformFee = totalAmount * 0.05; // 5% platform fee
    const ownerAmount = totalAmount - platformFee;

    // Create booking
    const booking = new Booking({
      bookingId: Booking.generateBookingId(),
      farmer: userId,
      warehouse: warehouseId,
      warehouseOwner: warehouse.owner._id,
      produce: {
        type: produceType,
        quantity: parseFloat(quantity),
        unit: 'tons',
        quality: 'good',
        description: notes || ''
      },
      storageRequirements: {
        storageType: warehouse.storageTypes?.[0] || 'general'
      },
      bookingDates: {
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        duration: calculatedDuration
      },
      pricing: {
        basePrice,
        totalAmount,
        currency: 'INR',
        platformFee,
        ownerAmount
      },
      status: 'pending'
    });

    await booking.save();

    // Populate the booking for response
    await booking.populate([
      { path: 'farmer', select: 'firstName lastName email phone' },
      { path: 'warehouse', select: 'name location' },
      { path: 'warehouseOwner', select: 'firstName lastName email phone' }
    ]);

    // Send email notifications
    try {
      // Get admin email
      const admin = await User.findOne({ role: 'admin' });
      const adminEmail = admin?.email || 'admin@farmerai.com';

      // Prepare booking data for emails
      const bookingData = {
        bookingId: booking.bookingId,
        farmerName: `${booking.farmer.firstName} ${booking.farmer.lastName}`,
        farmerEmail: booking.farmer.email,
        farmerPhone: booking.farmer.phone,
        warehouseName: booking.warehouse.name,
        warehouseLocation: `${booking.warehouse.location.city}, ${booking.warehouse.location.state}`,
        ownerName: `${booking.warehouseOwner.firstName} ${booking.warehouseOwner.lastName}`,
        produceType: booking.produce.type,
        quantity: booking.produce.quantity,
        unit: booking.produce.unit,
        startDate: booking.bookingDates.startDate.toLocaleDateString('en-IN'),
        endDate: booking.bookingDates.endDate.toLocaleDateString('en-IN'),
        totalAmount: booking.pricing.totalAmount,
        paymentStatus: booking.payment.status,
        notes: booking.produce.description
      };

      // Send email to admin
      await sendBookingConfirmationToAdmin(adminEmail, bookingData);

      // Send email to warehouse owner
      await sendBookingConfirmationToOwner(booking.warehouseOwner.email, bookingData);

      logger.info(`Email notifications sent for booking ${booking.bookingId}`);
    } catch (emailError) {
      logger.error('Failed to send booking confirmation emails:', emailError);
      // Don't fail the booking creation if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// Top-level: Create a pending hourly booking (tonnage × hours)
const createHourlyBooking = async (req, res) => {
  try {
    const userId = req.user.id;
    const { warehouseId, tonnage, hoursBooked, startTime, notes } = req.body || {};

    if (!warehouseId || !Number.isFinite(Number(tonnage)) || !Number.isFinite(Number(hoursBooked)) || !startTime) {
      return res.status(400).json({ success: false, message: 'warehouseId, tonnage, hoursBooked, startTime are required' });
    }

    const warehouse = await Warehouse.findById(warehouseId).populate('owner', 'firstName lastName email phone');
    if (!warehouse) {
      return res.status(404).json({ success: false, message: 'Warehouse not found' });
    }
    if (warehouse.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Warehouse is not available for booking' });
    }

    // Ensure capacity unit is tons for decrement logic; still allow booking creation
    const rate = Number(warehouse?.pricing?.hourlyRatePerTon) || 0;
    const t = Math.max(0, Number(tonnage));
    const h = Math.max(0, Number(hoursBooked));
    const totalAmount = Math.round(t * h * rate);

    const start = new Date(startTime);
    const end = new Date(start.getTime() + h * 60 * 60 * 1000);

    const booking = new Booking({
      bookingId: Booking.generateBookingId(),
      farmer: userId,
      warehouse: warehouseId,
      warehouseOwner: warehouse.owner._id,
      produce: {
        type: 'general',
        quantity: t,
        unit: 'tons',
        description: notes || ''
      },
      storageRequirements: {
        storageType: warehouse.storageTypes?.[0] || 'general'
      },
      bookingDates: {
        startDate: start,
        endDate: end,
        duration: h // store hours as duration for hourly flow
      },
      pricing: {
        basePrice: rate,
        totalAmount,
        currency: 'INR',
        platformFee: 0,
        ownerAmount: totalAmount
      },
      status: 'pending',
      payment: { status: 'pending' }
    });

    await booking.save();

    try { emitBookingEvent('created', { booking }); } catch (_) {}

    return res.status(201).json({ success: true, message: 'Hourly booking created', data: booking });
  } catch (error) {
    logger.error('Error creating hourly booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to create hourly booking', error: error.message });
  }
};

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

    // Ensure payment.amountDue is set for each booking
    const enrichedBookings = bookings.map(booking => {
      if (!booking.payment) booking.payment = {};
      if (typeof booking.payment.amountDue !== 'number') {
        const total = booking.pricing?.totalAmount;
        if (typeof total === 'number') {
          booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
        }
      }
      return booking;
    });

    const total = await Booking.countDocuments(query);

    res.json({
      success: true,
      data: enrichedBookings,
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
      .populate('warehouseOwner', 'firstName lastName email phone warehouseOwnerProfile')
      .lean();

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

    // Ensure payment.amountDue is set
    if (!booking.payment) booking.payment = {};
    if (typeof booking.payment.amountDue !== 'number') {
      const total = booking.pricing?.totalAmount;
      if (typeof total === 'number') {
        booking.payment.amountDue = (booking.payment.status === 'paid') ? 0 : total;
      }
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
    // Handle both field naming conventions
    const { bookingId, paymentId, signature, razorpay_payment_id, razorpay_signature, razorpay_order_id } = req.body;
    
    // Use the new field names if provided, otherwise fall back to old names
    const actualPaymentId = razorpay_payment_id || paymentId;
    const actualSignature = razorpay_signature || signature;
    const actualOrderId = razorpay_order_id || bookingId;

    const booking = await Booking.findOne({ bookingId: actualOrderId });
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment signature
    const isValidPayment = verifyRazorpayPayment(booking.payment.razorpayOrderId, actualPaymentId, actualSignature);
    if (!isValidPayment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Update booking status
    booking.status = 'awaiting-approval';
    booking.payment.status = 'paid';
    booking.payment.razorpayPaymentId = actualPaymentId;
    booking.payment.razorpaySignature = actualSignature;
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
        paymentId: actualPaymentId,
        signature: actualSignature,
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
        paymentId: actualPaymentId,
        amount: booking.pricing.totalAmount,
        paymentMethod: 'Razorpay',
        paymentDate: new Date().toLocaleDateString()
      });
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email:', emailError);
    }

    // Emit event for payment verified
    try { emitBookingEvent('payment-verified', { bookingId: booking._id, status: booking.status }); } catch (_) {}

    // Decrement warehouse available capacity for hourly-tonnage style bookings
    try {
      const wh = await Warehouse.findById(booking.warehouse);
      if (wh && wh.capacity) {
        const unit = (wh.capacity.unit || '').toLowerCase();
        const qtyTons = booking.produce && booking.produce.unit === 'tons' ? Number(booking.produce.quantity) : 0;
        if (unit === 'tons' && Number.isFinite(qtyTons) && qtyTons > 0) {
          const newAvailable = Math.max(0, (Number(wh.capacity.available) || 0) - qtyTons);
          wh.capacity.available = newAvailable;
          await wh.save();
          try { emitWarehouseEvent('capacity-updated', { warehouseId: wh._id, available: newAvailable, unit }); } catch (_) {}
        }
      }
    } catch (capErr) {
      logger.error('Failed to update warehouse capacity after payment:', capErr);
      // Do not fail the response; capacity can be reconciled by admin if needed
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

    // Emit event for booking approval
    try { emitBookingEvent('approved', { bookingId: booking._id }); } catch (_) {}
    
    // Convert to plain object and ensure payment.amountDue is set
    const bookingData = booking.toObject ? booking.toObject() : booking;
    if (!bookingData.payment) bookingData.payment = {};
    if (typeof bookingData.payment.amountDue !== 'number') {
      const total = bookingData.pricing?.totalAmount;
      if (typeof total === 'number') {
        bookingData.payment.amountDue = (bookingData.payment.status === 'paid') ? 0 : total;
      }
    }
    
    res.json({
      success: true,
      message: 'Booking approved successfully',
      data: bookingData
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

    // Emit event for booking rejection
    try { emitBookingEvent('rejected', { bookingId: booking._id }); } catch (_) {}
    
    // Convert to plain object and ensure payment.amountDue is set
    const bookingData = booking.toObject ? booking.toObject() : booking;
    if (!bookingData.payment) bookingData.payment = {};
    if (typeof bookingData.payment.amountDue !== 'number') {
      const total = bookingData.pricing?.totalAmount;
      if (typeof total === 'number') {
        bookingData.payment.amountDue = (bookingData.payment.status === 'paid' || bookingData.payment.status === 'refunded') ? 0 : total;
      }
    }
    
    res.json({
      success: true,
      message: 'Booking rejected successfully',
      data: bookingData
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

    // Emit event for booking cancellation
    try { emitBookingEvent('cancelled', { bookingId: booking._id }); } catch (_) {}
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

// Revenue summary for owner
const getOwnerRevenue = async (req, res) => {
  try {
    const userId = req.user.id;
    const { range = '30d' } = req.query;
    const now = new Date();
    const start = range === '7d' ? new Date(now - 7 * 24 * 60 * 60 * 1000)
               : range === '90d' ? new Date(now - 90 * 24 * 60 * 60 * 1000)
               : new Date(now - 30 * 24 * 60 * 60 * 1000);

    const pipeline = [
      { $match: { warehouseOwner: req.user._id || userId, createdAt: { $gte: start } } },
      { $group: {
          _id: null,
          totalEarnings: { $sum: '$pricing.ownerAmount' },
          count: { $sum: 1 }
        }
      }
    ];

    const [agg] = await Booking.aggregate(pipeline);

    return res.json({
      success: true,
      data: {
        totalEarnings: agg?.totalEarnings || 0,
        totalBookings: agg?.count || 0,
        range
      }
    });
  } catch (error) {
    logger.error('Error fetching owner revenue:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue', error: error.message });
  }
};

// Refund booking payment (owner only)
const refundBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { amount, reason = 'Refund requested by owner' } = req.body || {};

    const booking = await Booking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.warehouseOwner.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'You do not have permission to refund this booking' });
    }

    if (!booking.payment || !booking.payment.razorpayPaymentId) {
      return res.status(400).json({ success: false, message: 'No captured payment to refund' });
    }

    const refundAmount = Number.isFinite(amount) ? amount : booking.pricing.totalAmount;

    try {
      await createRefund(
        booking.payment.razorpayPaymentId,
        refundAmount,
        { reason }
      );

      booking.payment.status = 'refunded';
      booking.payment.refundedAt = new Date();
      booking.payment.refundAmount = refundAmount;
      booking.payment.refundReason = reason;
      await booking.save();

      try { emitBookingEvent('refunded', { bookingId: booking._id, amount: refundAmount }); } catch (_) {}
      return res.json({ success: true, message: 'Refund initiated', data: { bookingId: booking._id, refundAmount } });
    } catch (err) {
      logger.error('Refund initiation failed:', err);
      return res.status(500).json({ success: false, message: 'Failed to initiate refund', error: err.message });
    }
  } catch (error) {
    logger.error('Error refunding booking:', error);
    return res.status(500).json({ success: false, message: 'Failed to refund booking', error: error.message });
  }
};

// Owner revenue timeseries (daily/weekly/monthly)
const getOwnerRevenueTimeseries = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    const { granularity = 'daily', days = 30 } = req.query;

    const now = new Date();
    const start = new Date(now.getTime() - Math.max(1, parseInt(days)) * 24 * 60 * 60 * 1000);

    // Group date trunc expression
    const dateFormat = granularity === 'weekly' ? '%G-%V' : (granularity === 'monthly' ? '%Y-%m' : '%Y-%m-%d');

    const pipeline = [
      { $match: { warehouseOwner: ownerId, 'payment.status': 'paid', createdAt: { $gte: start } } },
      { $group: {
          _id: { $dateToString: { date: '$createdAt', format: dateFormat } },
          earnings: { $sum: '$pricing.ownerAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const points = await Booking.aggregate(pipeline);
    return res.json({ success: true, data: points, meta: { granularity, from: start, to: now } });
  } catch (error) {
    logger.error('Error fetching revenue timeseries:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch revenue timeseries', error: error.message });
  }
};

// Owner analytics: booking/revenue trends
const getOwnerAnalyticsTrends = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    const { days = 30 } = req.query;
    const now = new Date();
    const start = new Date(now.getTime() - Math.max(1, parseInt(days)) * 24 * 60 * 60 * 1000);

    const pipeline = [
      { $match: { warehouseOwner: ownerId, createdAt: { $gte: start } } },
      { $group: {
          _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d' } },
          bookings: { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ['$payment.status', 'paid'] }, '$pricing.ownerAmount', 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ];

    const points = await Booking.aggregate(pipeline);
    return res.json({ success: true, data: points, meta: { from: start, to: now } });
  } catch (error) {
    logger.error('Error fetching owner trends:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch trends', error: error.message });
  }
};

// Owner analytics: occupancy calendar for a given month
const getOwnerOccupancyCalendar = async (req, res) => {
  try {
    const ownerId = req.user._id || req.user.id;
    const { year, month } = req.query; // month: 1-12

    const y = parseInt(year) || new Date().getFullYear();
    const m = parseInt(month) ? parseInt(month) - 1 : new Date().getMonth();
    const monthStart = new Date(Date.UTC(y, m, 1, 0, 0, 0));
    const monthEnd = new Date(Date.UTC(y, m + 1, 0, 23, 59, 59));

    // Find bookings overlapping the month
    const bookings = await Booking.find({
      warehouseOwner: ownerId,
      'bookingDates.startDate': { $lte: monthEnd },
      'bookingDates.endDate': { $gte: monthStart },
      status: { $in: ['paid', 'awaiting-approval', 'approved', 'completed'] }
    }).select('bookingDates warehouse').lean();

    // Build daily occupancy counts
    const daysInMonth = new Date(y, m + 1, 0).getUTCDate();
    const daily = Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(Date.UTC(y, m, i + 1)).toISOString().slice(0, 10),
      bookings: 0
    }));

    bookings.forEach(b => {
      const start = new Date(b.bookingDates.startDate);
      const end = new Date(b.bookingDates.endDate);
      for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(Date.UTC(y, m, d));
        if (day >= start && day <= end) {
          daily[d - 1].bookings += 1;
        }
      }
    });

    return res.json({ success: true, data: daily, meta: { year: y, month: m + 1 } });
  } catch (error) {
    logger.error('Error fetching occupancy calendar:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch occupancy calendar', error: error.message });
  }
};

module.exports = {
  createBooking,
  createHourlyBooking,
  getBookings,
  getBookingById,
  verifyPayment,
  approveBooking,
  rejectBooking,
  cancelBooking,
  refundBooking,
  getBookingStats,
  getOwnerRevenue,
  getOwnerRevenueTimeseries,
  getOwnerAnalyticsTrends,
  getOwnerOccupancyCalendar
};
