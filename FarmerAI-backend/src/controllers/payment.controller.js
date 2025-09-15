// src/controllers/payment.controller.js
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { verifyWebhookSignature, getPaymentDetails } = require('../config/razorpay');
const logger = require('../utils/logger');

// Get payment history for a user
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const query = { farmer: userId };
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('booking', 'bookingId warehouse produce bookingDates')
      .populate('warehouseOwner', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: payments,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment history',
      error: error.message
    });
  }
};

// Get payment by ID
const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const payment = await Payment.findById(id)
      .populate('booking', 'bookingId warehouse produce bookingDates status')
      .populate('farmer', 'firstName lastName email phone')
      .populate('warehouseOwner', 'firstName lastName email phone');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Check if user has permission to view this payment
    const canView = payment.farmer._id.toString() === userId || 
                   payment.warehouseOwner._id.toString() === userId ||
                   req.user.role === 'admin';

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this payment'
      });
    }

    res.json({
      success: true,
      data: payment
    });
  } catch (error) {
    logger.error('Error fetching payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment',
      error: error.message
    });
  }
};

// Get payment statistics
const getPaymentStats = async (req, res) => {
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

    const stats = await Payment.getStats(filters);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment statistics',
      error: error.message
    });
  }
};

// Razorpay webhook handler
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const isValid = verifyWebhookSignature(
      body,
      signature,
      process.env.RAZORPAY_WEBHOOK_SECRET
    );

    if (!isValid) {
      logger.error('Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body;
    logger.info('Received webhook event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      case 'refund.created':
        await handleRefundCreated(event);
        break;
      case 'payout.processed':
        await handlePayoutProcessed(event);
        break;
      default:
        logger.info('Unhandled webhook event:', event.event);
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('Error handling webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Webhook processing failed',
      error: error.message
    });
  }
};

// Handle payment captured event
const handlePaymentCaptured = async (event) => {
  try {
    const paymentData = event.payload.payment.entity;
    const orderId = paymentData.order_id;

    // Find payment by order ID
    const payment = await Payment.findOne({ 'razorpay.orderId': orderId });
    if (!payment) {
      logger.error('Payment not found for order:', orderId);
      return;
    }

    // Update payment status
    payment.razorpay.paymentId = paymentData.id;
    payment.razorpay.status = 'paid';
    payment.razorpay.method = paymentData.method;
    payment.razorpay.bank = paymentData.bank;
    payment.razorpay.wallet = paymentData.wallet;
    payment.razorpay.vpa = paymentData.vpa;
    payment.razorpay.cardId = paymentData.card_id;
    payment.razorpay.international = paymentData.international;
    payment.razorpay.amountPaid = paymentData.amount / 100; // Convert from paise
    payment.razorpay.captured = paymentData.captured;
    payment.razorpay.description = paymentData.description;
    payment.razorpay.fee = paymentData.fee;
    payment.razorpay.tax = paymentData.tax;
    payment.status = 'completed';

    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.status = 'awaiting-approval';
      booking.payment.status = 'paid';
      booking.payment.razorpayPaymentId = paymentData.id;
      booking.payment.paidAt = new Date();
      await booking.save();
    }

    logger.info('Payment captured successfully:', paymentData.id);
  } catch (error) {
    logger.error('Error handling payment captured:', error);
  }
};

// Handle payment failed event
const handlePaymentFailed = async (event) => {
  try {
    const paymentData = event.payload.payment.entity;
    const orderId = paymentData.order_id;

    // Find payment by order ID
    const payment = await Payment.findOne({ 'razorpay.orderId': orderId });
    if (!payment) {
      logger.error('Payment not found for order:', orderId);
      return;
    }

    // Update payment status
    payment.razorpay.status = 'failed';
    payment.razorpay.errorCode = paymentData.error_code;
    payment.razorpay.errorDescription = paymentData.error_description;
    payment.status = 'failed';

    await payment.save();

    // Update booking status
    const booking = await Booking.findById(payment.booking);
    if (booking) {
      booking.status = 'pending';
      booking.payment.status = 'failed';
      await booking.save();
    }

    logger.info('Payment failed:', paymentData.id);
  } catch (error) {
    logger.error('Error handling payment failed:', error);
  }
};

// Handle refund created event
const handleRefundCreated = async (event) => {
  try {
    const refundData = event.payload.refund.entity;
    const paymentId = refundData.payment_id;

    // Find payment by payment ID
    const payment = await Payment.findOne({ 'razorpay.paymentId': paymentId });
    if (!payment) {
      logger.error('Payment not found for refund:', paymentId);
      return;
    }

    // Update refund status
    payment.refund.razorpayRefundId = refundData.id;
    payment.refund.amount = refundData.amount / 100; // Convert from paise
    payment.refund.status = 'processed';
    payment.refund.processedAt = new Date();
    payment.amount.amountRefunded = refundData.amount / 100;
    payment.razorpay.amountRefunded = refundData.amount / 100;

    if (refundData.amount === payment.amount.total * 100) {
      payment.refund.status = 'full';
      payment.status = 'refunded';
    } else {
      payment.refund.status = 'partial';
    }

    await payment.save();

    logger.info('Refund processed successfully:', refundData.id);
  } catch (error) {
    logger.error('Error handling refund created:', error);
  }
};

// Handle payout processed event
const handlePayoutProcessed = async (event) => {
  try {
    const payoutData = event.payload.payout.entity;
    const payoutId = payoutData.id;

    // Find payment by payout ID
    const payment = await Payment.findOne({ 'payout.razorpayPayoutId': payoutId });
    if (!payment) {
      logger.error('Payment not found for payout:', payoutId);
      return;
    }

    // Update payout status
    payment.payout.status = 'completed';
    payment.payout.processedAt = new Date();

    await payment.save();

    logger.info('Payout processed successfully:', payoutId);
  } catch (error) {
    logger.error('Error handling payout processed:', error);
  }
};

module.exports = {
  getPaymentHistory,
  getPaymentById,
  getPaymentStats,
  handleWebhook
};