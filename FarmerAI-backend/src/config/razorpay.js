// src/config/razorpay.js
const Razorpay = require('razorpay');
const crypto = require('crypto');

// Check if Razorpay credentials are available
const hasRazorpayCredentials = process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET;

// Initialize Razorpay instance only if credentials are available
let razorpay = null;
if (hasRazorpayCredentials) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} else {
  console.warn('⚠️  Razorpay credentials not found. Payment features will be disabled.');
}

// Verify webhook signature
const verifyWebhookSignature = (body, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
};

// Create order
const createOrder = async (amount, currency = 'INR', receipt = null) => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const options = {
      amount: amount * 100, // Razorpay expects amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      payment_capture: 1 // Auto capture payment
    };

    const order = await razorpay.orders.create(options);
    return order;
  } catch (error) {
    throw new Error(`Failed to create Razorpay order: ${error.message}`);
  }
};

// Verify payment signature
const verifyPayment = (orderId, paymentId, signature) => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');
  
  return expectedSignature === signature;
};

// Create refund
const createRefund = async (paymentId, amount, notes = {}) => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const refund = await razorpay.payments.refund(paymentId, {
      amount: amount * 100, // Convert to paise
      notes
    });
    return refund;
  } catch (error) {
    throw new Error(`Failed to create refund: ${error.message}`);
  }
};

// Create payout
const createPayout = async (accountNumber, ifscCode, amount, purpose = 'payout') => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const payout = await razorpay.payouts.create({
      account_number: accountNumber,
      ifsc_code: ifscCode,
      amount: amount * 100, // Convert to paise
      currency: 'INR',
      mode: 'IMPS',
      purpose,
      fund_account: {
        account_type: 'bank_account',
        bank_account: {
          name: 'Warehouse Owner',
          ifsc: ifscCode,
          account_number: accountNumber
        }
      }
    });
    return payout;
  } catch (error) {
    throw new Error(`Failed to create payout: ${error.message}`);
  }
};

// Get payment details
const getPaymentDetails = async (paymentId) => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const payment = await razorpay.payments.fetch(paymentId);
    return payment;
  } catch (error) {
    throw new Error(`Failed to fetch payment details: ${error.message}`);
  }
};

// Get order details
const getOrderDetails = async (orderId) => {
  if (!hasRazorpayCredentials) {
    throw new Error('Razorpay credentials not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.');
  }

  try {
    const order = await razorpay.orders.fetch(orderId);
    return order;
  } catch (error) {
    throw new Error(`Failed to fetch order details: ${error.message}`);
  }
};

module.exports = {
  razorpay,
  createOrder,
  verifyPayment,
  verifyWebhookSignature,
  createRefund,
  createPayout,
  getPaymentDetails,
  getOrderDetails
};
