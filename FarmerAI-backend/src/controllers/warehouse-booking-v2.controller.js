const mongoose = require('mongoose');
const { WarehouseBooking, BookingStatus, PaymentStatus } = require('../models/WarehouseBooking');
const Warehouse = require('../models/Warehouse');
const User = require('../models/User');
const { createOrder, verifyPayment: verifyRazorpayPayment } = require('../config/razorpay');
const { sendEmail } = require('../services/email.service');
const logger = require('../utils/logger');
const { generateInvoice } = require('../services/invoice.service');
const path = require('path');
const fs = require('fs');

/**
 * @desc    Create a new warehouse booking
 * @route   POST /api/v2/warehouses/:warehouseId/bookings
 * @access  Private
 */
const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { warehouseId } = req.params;
    const userId = req.user.id;
    const { startDate, endDate, storageType, quantity, unit, notes } = req.body;

    // Validate input
    if (!startDate || !endDate || !storageType || !quantity || !unit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: startDate, endDate, storageType, quantity, unit'
      });
    }

    // Parse dates
    const bookingStartDate = new Date(startDate);
    const bookingEndDate = new Date(endDate);
    
    // Validate dates
    if (isNaN(bookingStartDate) || isNaN(bookingEndDate) || bookingEndDate <= bookingStartDate) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. End date must be after start date.'
      });
    }

    // Calculate duration in days
    const durationInDays = Math.ceil((bookingEndDate - bookingStartDate) / (1000 * 60 * 60 * 24));

    // Get warehouse with owner details
    const warehouse = await Warehouse.findById(warehouseId)
      .populate('owner', 'firstName lastName email phone')
      .session(session);

    if (!warehouse) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Warehouse not found'
      });
    }

    // Check warehouse availability
    if (warehouse.status !== 'active') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Warehouse is not available for booking'
      });
    }

    // Check for existing bookings in the same period
    const existingBookings = await WarehouseBooking.find({
      warehouse: warehouseId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        { 'bookingPeriod.startDate': { $lt: bookingEndDate }, 'bookingPeriod.endDate': { $gt: bookingStartDate } },
        { 'bookingPeriod.startDate': { $gte: bookingStartDate, $lt: bookingEndDate } },
        { 'bookingPeriod.endDate': { $gt: bookingStartDate, $lte: bookingEndDate } }
      ]
    }).session(session);

    if (existingBookings.length > 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Warehouse is already booked for the selected dates',
        conflicts: existingBookings.map(b => ({
          startDate: b.bookingPeriod.startDate,
          endDate: b.bookingPeriod.endDate,
          status: b.status
        }))
      });
    }

    // Calculate pricing
    const basePrice = warehouse.pricing.basePrice * durationInDays * quantity;
    const taxAmount = basePrice * (warehouse.pricing.taxRate || 0.18); // Default 18% tax
    const totalAmount = basePrice + taxAmount;

    // Create booking record
    const booking = new WarehouseBooking({
      user: userId,
      warehouse: warehouseId,
      bookingPeriod: {
        startDate: bookingStartDate,
        endDate: bookingEndDate,
        durationInDays
      },
      storageDetails: {
        storageType,
        quantity,
        unit
      },
      pricing: {
        basePrice,
        taxAmount,
        totalAmount,
        currency: 'INR',
        pricePerDay: warehouse.pricing.basePrice
      },
      status: BookingStatus.PENDING,
      notes
    });

    await booking.save({ session });

    // Create Razorpay order
    const razorpayOrder = await createOrder(
      Math.round(totalAmount * 100), // amount in paise
      'INR', // currency
      `booking_${booking._id}` // receipt
    );

    if (!razorpayOrder || !razorpayOrder.id) {
      throw new Error('Failed to create Razorpay order');
    }

    // Add Razorpay order ID to booking
    booking.payment.razorpayOrderId = razorpayOrder.id;
    booking.payment.status = PaymentStatus.PENDING;
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send booking confirmation email (without payment link)
    const user = await User.findById(userId);
    await sendBookingConfirmationEmail(user, booking, warehouse, razorpayOrder);

    res.status(201).json({
      success: true,
      message: 'Booking created successfully. Please complete the payment to confirm your booking.',
      data: {
        booking,
        payment: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Verify payment and confirm booking
 * @route   POST /api/v2/bookings/:bookingId/verify-payment
 * @access  Private
 */
const verifyBookingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    // Handle both field naming conventions
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, paymentId, orderId, signature } = req.body;
    
    // Use the new field names if provided, otherwise fall back to old names
    const actualPaymentId = razorpay_payment_id || paymentId;
    const actualOrderId = razorpay_order_id || orderId;
    const actualSignature = razorpay_signature || signature;

    if (!actualPaymentId || !actualOrderId || !actualSignature) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    // Get booking with warehouse and user details
    const booking = await WarehouseBooking.findById(bookingId)
      .populate('user', 'firstName lastName email')
      .populate('warehouse', 'name location owner')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify payment signature
    const isValid = await verifyRazorpayPayment(
      actualOrderId,
      actualPaymentId,
      actualSignature
    );

    if (!isValid) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature. Payment verification failed.'
      });
    }

    // Update booking with payment details
    booking.payment = {
      ...booking.payment,
      razorpayPaymentId: actualPaymentId,
      razorpaySignature: actualSignature,
      status: PaymentStatus.PAID,
      paymentDate: new Date()
    };

    // Update booking status
    booking.status = BookingStatus.CONFIRMED;
    await booking.save({ session });

    // Generate invoice
    const invoicePath = await generateInvoice(booking);
    booking.invoiceUrl = `/invoices/${path.basename(invoicePath)}`;
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send confirmation email with invoice
    await sendBookingConfirmationEmail(booking.user, booking, booking.warehouse, null, invoicePath);

    res.json({
      success: true,
      message: 'Payment verified and booking confirmed successfully',
      data: {
        booking,
        invoiceUrl: booking.invoiceUrl
      }
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get user's bookings
 * @route   GET /api/v2/bookings
 * @access  Private
 */
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { user: userId };
    if (status && Object.values(BookingStatus).includes(status)) {
      query.status = status;
    }

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort: { createdAt: -1 },
      populate: [
        { path: 'warehouse', select: 'name location images' },
        { path: 'user', select: 'firstName lastName email phone' }
      ]
    };

    const bookings = await WarehouseBooking.paginate(query, options);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get booking by ID
 * @route   GET /api/v2/bookings/:bookingId
 * @access  Private
 */
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await WarehouseBooking.findOne({
      _id: bookingId,
      $or: [
        { user: userId },
        { 'warehouse.owner': userId } // Allow warehouse owner to view
      ]
    })
      .populate('warehouse', 'name location images owner')
      .populate('user', 'firstName lastName email phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
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
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Cancel booking
 * @route   PUT /api/v2/bookings/:bookingId/cancel
 * @access  Private
 */
const cancelBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const booking = await WarehouseBooking.findOne({
      _id: bookingId,
      user: userId
    }).session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Check if booking can be cancelled
    if (booking.status !== BookingStatus.CONFIRMED) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Booking cannot be cancelled in its current state (${booking.status})`
      });
    }

    // Check if booking has already started
    if (new Date(booking.bookingPeriod.startDate) <= new Date()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a booking that has already started'
      });
    }

    // Update booking status
    booking.status = BookingStatus.CANCELLED;
    booking.cancellationReason = reason;
    booking.cancellationDate = new Date();
    await booking.save({ session });

    // TODO: Implement refund logic if needed
    // This would involve calling Razorpay's refund API

    await session.commitTransaction();
    session.endSession();

    // Send cancellation email
    const user = await User.findById(userId);
    const warehouse = await Warehouse.findById(booking.warehouse);
    await sendBookingCancellationEmail(user, booking, warehouse, reason);

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error cancelling booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get warehouse availability
 * @route   GET /api/v2/warehouses/:warehouseId/availability
 * @access  Public
 */
const getWarehouseAvailability = async (req, res) => {
  try {
    const { warehouseId } = req.params;
    const { startDate, endDate } = req.query;

    // Validate dates
    const start = startDate ? new Date(startDate) : new Date();
    const end = endDate ? new Date(endDate) : new Date();
    end.setMonth(end.getMonth() + 1); // Default to 1 month ahead

    if (isNaN(start) || isNaN(end) || end <= start) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date range. End date must be after start date.'
      });
    }

    // Get all bookings for the warehouse in the date range
    const bookings = await WarehouseBooking.find({
      warehouse: warehouseId,
      status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] },
      $or: [
        { 'bookingPeriod.startDate': { $lt: end }, 'bookingPeriod.endDate': { $gt: start } }
      ]
    });

    // Generate available slots
    const availability = [];
    let currentDate = new Date(start);
    
    while (currentDate < end) {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const isBooked = bookings.some(booking => {
        return (
          currentDate >= booking.bookingPeriod.startDate &&
          currentDate < booking.bookingPeriod.endDate
        );
      });

      availability.push({
        date: new Date(currentDate),
        available: !isBooked
      });

      currentDate = nextDate;
    }

    res.json({
      success: true,
      data: {
        warehouseId,
        startDate: start,
        endDate: end,
        availability
      }
    });
  } catch (error) {
    logger.error('Error checking warehouse availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check warehouse availability',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Get all bookings (Admin only)
 * @route   GET /api/v2/admin/bookings
 * @access  Private/Admin
 */
const getAllBookings = async (req, res) => {
  try {
    const { status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};
    if (status && Object.values(BookingStatus).includes(status)) {
      query.status = status;
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const options = {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      sort,
      populate: [
        { path: 'warehouse', select: 'name location' },
        { path: 'user', select: 'firstName lastName email' }
      ]
    };

    const bookings = await WarehouseBooking.paginate(query, options);

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    logger.error('Error fetching all bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Update booking status (Admin only)
 * @route   PUT /api/v2/admin/bookings/:bookingId/status
 * @access  Private/Admin
 */
const updateBookingStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    if (!status || !Object.values(BookingStatus).includes(status)) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Invalid status provided'
      });
    }

    const booking = await WarehouseBooking.findById(bookingId)
      .populate('user', 'firstName lastName email')
      .populate('warehouse', 'name location')
      .session(session);

    if (!booking) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Store original pricing data to prevent it from being reset
    const originalPricing = { ...booking.pricing };

    // Update booking status
    const previousStatus = booking.status;
    booking.status = status;
    booking.adminNotes = notes || booking.adminNotes;
    
    // Ensure pricing data is preserved after status update
    if ((!booking.pricing || booking.pricing.totalAmount === 0) && originalPricing.totalAmount > 0) {
      booking.pricing = originalPricing;
    }

    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Send status update email to user
    if (booking.user) {
      await sendBookingStatusUpdateEmail(
        booking.user,
        booking,
        booking.warehouse,
        previousStatus,
        status,
        notes
      );
    }

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Helper function to send booking confirmation email
async function sendBookingConfirmationEmail(user, booking, warehouse, razorpayOrder, invoicePath = null) {
  try {
    const subject = 'Your Warehouse Booking is Pending Payment';
    const paymentUrl = `${process.env.CLIENT_URL}/bookings/${booking._id}/payment?order_id=${razorpayOrder.id}`;
    
    let emailContent = `
      <h2>Booking Confirmation - Pending Payment</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your booking for <strong>${warehouse.name}</strong> has been created successfully.</p>
      <p>Please complete your payment to confirm your booking.</p>
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Booking ID: ${booking._id}</li>
        <li>Warehouse: ${warehouse.name}</li>
        <li>Location: ${warehouse.location.address}, ${warehouse.location.city}, ${warehouse.location.state}</li>
        <li>Duration: ${booking.bookingPeriod.durationInDays} days (${booking.bookingPeriod.startDate.toDateString()} - ${booking.bookingPeriod.endDate.toDateString()})</li>
        <li>Total Amount: ₹${booking.pricing.totalAmount.toFixed(2)}</li>
      </ul>
      <p>Please click the button below to complete your payment:</p>
      <a href="${paymentUrl}" style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0;">
        Complete Payment
      </a>
      <p>If the button doesn't work, copy and paste this link into your browser:</p>
      <p>${paymentUrl}</p>
      <p>This payment link will expire in 30 minutes.</p>
    `;

    if (invoicePath && fs.existsSync(invoicePath)) {
      const attachments = [{
        filename: `invoice-${booking._id}.pdf`,
        path: invoicePath,
        contentType: 'application/pdf'
      }];
      
      await sendEmail({
        to: user.email,
        subject: 'Your Warehouse Booking is Confirmed!',
        html: emailContent.replace('Pending Payment', 'Confirmed!').replace('Please complete your payment to confirm your booking.', 'Your booking has been confirmed!'),
        attachments
      });
    } else {
      await sendEmail({
        to: user.email,
        subject,
        html: emailContent
      });
    }
  } catch (error) {
    logger.error('Error sending booking confirmation email:', error);
  }
}

// Helper function to send booking cancellation email
async function sendBookingCancellationEmail(user, booking, warehouse, reason) {
  try {
    const subject = 'Your Booking Has Been Cancelled';
    const emailContent = `
      <h2>Booking Cancellation Confirmation</h2>
      <p>Hello ${user.firstName},</p>
      <p>Your booking for <strong>${warehouse.name}</strong> has been cancelled.</p>
      ${reason ? `<p><strong>Reason for cancellation:</strong> ${reason}</p>` : ''}
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Booking ID: ${booking._id}</li>
        <li>Warehouse: ${warehouse.name}</li>
        <li>Location: ${warehouse.location.address}, ${warehouse.location.city}, ${warehouse.location.state}</li>
        <li>Original Dates: ${booking.bookingPeriod.startDate.toDateString()} - ${booking.bookingPeriod.endDate.toDateString()}</li>
        <li>Amount: ₹${booking.pricing.totalAmount.toFixed(2)}</li>
        <li>Status: ${booking.status}</li>
      </ul>
      <p>If you didn't request this cancellation or have any questions, please contact our support team.</p>
      <p>Thank you for using our service.</p>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html: emailContent
    });
  } catch (error) {
    logger.error('Error sending booking cancellation email:', error);
  }
}

// Helper function to send booking status update email
async function sendBookingStatusUpdateEmail(user, booking, warehouse, previousStatus, newStatus, notes) {
  try {
    const subject = `Booking ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)} - ${warehouse.name}`;
    const emailContent = `
      <h2>Booking Status Updated</h2>
      <p>Hello ${user.firstName},</p>
      <p>The status of your booking for <strong>${warehouse.name}</strong> has been updated from <strong>${previousStatus}</strong> to <strong>${newStatus}</strong>.</p>
      ${notes ? `<p><strong>Admin Notes:</strong> ${notes}</p>` : ''}
      <p><strong>Booking Details:</strong></p>
      <ul>
        <li>Booking ID: ${booking._id}</li>
        <li>Warehouse: ${warehouse.name}</li>
        <li>Location: ${warehouse.location.address}, ${warehouse.location.city}, ${warehouse.location.state}</li>
        <li>Dates: ${booking.bookingPeriod.startDate.toDateString()} - ${booking.bookingPeriod.endDate.toDateString()}</li>
        <li>Amount: ₹${booking.pricing.totalAmount.toFixed(2)}</li>
        <li>Status: ${newStatus}</li>
      </ul>
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you for using our service.</p>
    `;

    await sendEmail({
      to: user.email,
      subject,
      html: emailContent
    });
  } catch (error) {
    logger.error('Error sending booking status update email:', error);
  }
}

module.exports = {
  createBooking,
  verifyBookingPayment,
  getUserBookings,
  getBookingById,
  cancelBooking,
  getWarehouseAvailability,
  getAllBookings,
  updateBookingStatus,
  BookingStatus,
  PaymentStatus
};
