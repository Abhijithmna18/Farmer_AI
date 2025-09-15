// src/controllers/razorpay-example.controller.js
// Complete Razorpay API integration examples

const { createOrder, verifyPayment, createRefund } = require('../config/razorpay');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const logger = require('../utils/logger');

// Example 1: Create Razorpay Order for Booking
const createBookingOrder = async (req, res) => {
  try {
    const { bookingId, amount, currency = 'INR' } = req.body;

    // Validate booking exists
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Create Razorpay order
    const order = await createOrder(amount, currency, `booking_${bookingId}`);

    // Update booking with order ID
    booking.payment.razorpayOrderId = order.id;
    await booking.save();

    res.json({
      success: true,
      message: 'Order created successfully',
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID, // Frontend needs this
        bookingId: bookingId
      }
    });

  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error.message
    });
  }
};

// Example 2: Verify Payment and Update Booking
const verifyBookingPayment = async (req, res) => {
  try {
    const { bookingId, paymentId, signature, orderId } = req.body;

    // Verify payment signature
    const isValidPayment = verifyPayment(orderId, paymentId, signature);
    
    if (!isValidPayment) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Find and update booking
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
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
      booking: bookingId,
      farmer: booking.farmer,
      warehouseOwner: booking.warehouseOwner,
      amount: {
        total: booking.pricing.totalAmount,
        baseAmount: booking.pricing.basePrice,
        platformFee: booking.pricing.platformFee,
        ownerAmount: booking.pricing.ownerAmount,
        currency: 'INR'
      },
      razorpay: {
        orderId: orderId,
        paymentId: paymentId,
        signature: signature,
        status: 'paid',
        captured: true
      },
      status: 'completed'
    });

    await payment.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        bookingId: bookingId,
        paymentId: paymentId,
        status: 'paid'
      }
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

// Example 3: Process Refund
const processRefund = async (req, res) => {
  try {
    const { paymentId, amount, reason } = req.body;

    // Find payment record
    const payment = await Payment.findOne({ 'razorpay.paymentId': paymentId });
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Process refund through Razorpay
    const refund = await createRefund(paymentId, amount, { reason });

    // Update payment record
    payment.refund.razorpayRefundId = refund.id;
    payment.refund.amount = amount;
    payment.refund.status = 'processed';
    payment.refund.reason = reason;
    payment.refund.processedAt = new Date();
    payment.amount.amountRefunded = amount;
    payment.status = 'refunded';

    await payment.save();

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refund.id,
        amount: amount,
        status: 'processed'
      }
    });

  } catch (error) {
    logger.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// Example 4: Get Payment Status
const getPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findOne({ 'razorpay.paymentId': paymentId })
      .populate('booking', 'bookingId status')
      .populate('farmer', 'firstName lastName email');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        paymentId: payment.paymentId,
        razorpayPaymentId: payment.razorpay.paymentId,
        status: payment.status,
        amount: payment.amount.total,
        refunded: payment.amount.amountRefunded,
        booking: payment.booking,
        farmer: payment.farmer
      }
    });

  } catch (error) {
    logger.error('Error fetching payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment status',
      error: error.message
    });
  }
};

// Example 5: Webhook Handler
const handleRazorpayWebhook = async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = JSON.stringify(req.body);

    // Verify webhook signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook signature'
      });
    }

    const event = req.body;
    logger.info('Received Razorpay webhook:', event.event);

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

// Helper function to handle payment captured
const handlePaymentCaptured = async (event) => {
  try {
    const paymentData = event.payload.payment.entity;
    const orderId = paymentData.order_id;

    // Find booking by order ID
    const booking = await Booking.findOne({ 'payment.razorpayOrderId': orderId });
    if (booking) {
      booking.payment.status = 'paid';
      booking.payment.razorpayPaymentId = paymentData.id;
      booking.payment.paidAt = new Date();
      booking.status = 'awaiting-approval';
      await booking.save();
    }

    logger.info('Payment captured successfully:', paymentData.id);
  } catch (error) {
    logger.error('Error handling payment captured:', error);
  }
};

// Helper function to handle payment failed
const handlePaymentFailed = async (event) => {
  try {
    const paymentData = event.payload.payment.entity;
    const orderId = paymentData.order_id;

    // Find booking by order ID
    const booking = await Booking.findOne({ 'payment.razorpayOrderId': orderId });
    if (booking) {
      booking.payment.status = 'failed';
      booking.status = 'pending';
      await booking.save();
    }

    logger.info('Payment failed:', paymentData.id);
  } catch (error) {
    logger.error('Error handling payment failed:', error);
  }
};

// Helper function to handle refund created
const handleRefundCreated = async (event) => {
  try {
    const refundData = event.payload.refund.entity;
    const paymentId = refundData.payment_id;

    // Find payment by payment ID
    const payment = await Payment.findOne({ 'razorpay.paymentId': paymentId });
    if (payment) {
      payment.refund.razorpayRefundId = refundData.id;
      payment.refund.amount = refundData.amount / 100; // Convert from paise
      payment.refund.status = 'processed';
      payment.refund.processedAt = new Date();
      payment.amount.amountRefunded = refundData.amount / 100;
      await payment.save();
    }

    logger.info('Refund processed successfully:', refundData.id);
  } catch (error) {
    logger.error('Error handling refund created:', error);
  }
};

module.exports = {
  createBookingOrder,
  verifyBookingPayment,
  processRefund,
  getPaymentStatus,
  handleRazorpayWebhook
};





