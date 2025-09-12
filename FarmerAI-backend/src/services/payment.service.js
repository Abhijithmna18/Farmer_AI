const Razorpay = require('razorpay');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Lazy/guarded Razorpay init so server doesn't crash if keys are absent
const hasRazorpayKeys = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
let razorpay = null;
if (hasRazorpayKeys) {
  try {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info('Razorpay initialized');
  } catch (e) {
    logger.warn(`Razorpay init failed: ${e?.message || e}. Payments will remain disabled.`);
    razorpay = null;
  }
} else {
  logger.info('Razorpay keys not found. Payment gateway features are disabled.');
}

class PaymentService {
  // Create Razorpay order
  async createRazorpayOrder(amount, currency = 'INR', orderId, customerId) {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const options = {
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        receipt: orderId,
        notes: { customer_id: customerId, order_id: orderId },
      };
      const order = await razorpay.orders.create(options);
      logger.info(`Razorpay order created: ${order.id} for amount: ${amount}`);
      return { success: true, data: { orderId: order.id, amount: order.amount, currency: order.currency, receipt: order.receipt } };
    } catch (error) {
      logger.error('Error creating Razorpay order:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify Razorpay payment
  async verifyRazorpayPayment(paymentData) {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = paymentData || {};
      const body = `${razorpay_order_id}|${razorpay_payment_id}`;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body).digest('hex');
      const isAuthentic = expectedSignature === razorpay_signature;
      if (!isAuthentic) {
        logger.error('Payment verification failed: Invalid signature');
        return { success: false, error: 'Invalid payment signature' };
      }
      const payment = await razorpay.payments.fetch(razorpay_payment_id);
      logger.info(`Payment verified successfully: ${razorpay_payment_id}`);
      return { success: true, data: { paymentId: razorpay_payment_id, orderId: razorpay_order_id, amount: payment.amount / 100, currency: payment.currency, status: payment.status, method: payment.method, captured: payment.captured, description: payment.description, notes: payment.notes } };
    } catch (error) {
      logger.error('Error verifying Razorpay payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Capture payment
  async capturePayment(paymentId, amount) {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const payment = await razorpay.payments.capture(paymentId, Math.round(amount * 100), 'INR');
      logger.info(`Payment captured successfully: ${paymentId}`);
      return { success: true, data: payment };
    } catch (error) {
      logger.error('Error capturing payment:', error);
      return { success: false, error: error.message };
    }
  }

  // Refund payment
  async refundPayment(paymentId, amount, reason = 'Refund requested') {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const refund = await razorpay.payments.refund(paymentId, { amount: Math.round(amount * 100), notes: { reason } });
      logger.info(`Refund processed successfully: ${refund.id}`);
      return { success: true, data: { refundId: refund.id, paymentId: refund.payment_id, amount: refund.amount / 100, status: refund.status, notes: refund.notes } };
    } catch (error) {
      logger.error('Error processing refund:', error);
      return { success: false, error: error.message };
    }
  }

  // Get payment details
  async getPaymentDetails(paymentId) {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const payment = await razorpay.payments.fetch(paymentId);
      return { success: true, data: { paymentId: payment.id, amount: payment.amount / 100, currency: payment.currency, status: payment.status, method: payment.method, captured: payment.captured, description: payment.description, notes: payment.notes, createdAt: new Date(payment.created_at * 1000) } };
    } catch (error) {
      logger.error('Error fetching payment details:', error);
      return { success: false, error: error.message };
    }
  }

  // Get refund details
  async getRefundDetails(refundId) {
    if (!hasRazorpayKeys || !razorpay) {
      return { success: false, error: 'Payment gateway disabled' };
    }
    try {
      const refund = await razorpay.refunds.fetch(refundId);
      return { success: true, data: { refundId: refund.id, paymentId: refund.payment_id, amount: refund.amount / 100, status: refund.status, notes: refund.notes, createdAt: new Date(refund.created_at * 1000) } };
    } catch (error) {
      logger.error('Error fetching refund details:', error);
      return { success: false, error: error.message };
    }
  }

  // Create UPI payment link (works without Razorpay)
  async createUPIPaymentLink(amount, orderId, customerId) {
    try {
      const upiId = process.env.UPI_ID || 'your-upi-id@bank';
      const merchantName = process.env.MERCHANT_NAME || 'FarmerAI';
      const upiLink = `upi://pay?pa=${upiId}&pn=${merchantName}&am=${amount}&cu=INR&tn=Order ${orderId}`;
      return { success: true, data: { upiLink, upiId, amount, orderId } };
    } catch (error) {
      logger.error('Error creating UPI payment link:', error);
      return { success: false, error: error.message };
    }
  }

  // Process COD (works without Razorpay)
  async processCOD(orderId, amount) {
    try {
      logger.info(`COD order processed: ${orderId} for amount: ${amount}`);
      return { success: true, data: { paymentId: `COD_${orderId}_${Date.now()}`, orderId, amount, status: 'pending', method: 'cod', captured: false } };
    } catch (error) {
      logger.error('Error processing COD:', error);
      return { success: false, error: error.message };
    }
  }

  // Calculate payment fees
  calculatePaymentFees(amount, paymentMethod) {
    const fees = { gatewayFee: 0, platformFee: 0, netAmount: amount };
    switch (paymentMethod) {
      case 'razorpay':
        if (!hasRazorpayKeys) break;
        fees.gatewayFee = Math.round(amount * 0.018 * 100) / 100;
        fees.platformFee = Math.round(amount * 0.02 * 100) / 100;
        break;
      case 'stripe':
        fees.gatewayFee = Math.round(amount * 0.029 * 100) / 100;
        fees.platformFee = Math.round(amount * 0.02 * 100) / 100;
        break;
      case 'upi':
        fees.gatewayFee = Math.round(amount * 0.01 * 100) / 100;
        fees.platformFee = Math.round(amount * 0.02 * 100) / 100;
        break;
      case 'cod':
        fees.gatewayFee = 0;
        fees.platformFee = Math.round(amount * 0.02 * 100) / 100;
        break;
      default:
        fees.gatewayFee = 0;
        fees.platformFee = Math.round(amount * 0.02 * 100) / 100;
    }
    fees.netAmount = amount - fees.gatewayFee - fees.platformFee;
    return fees;
  }

  // Validate payment method based on availability
  validatePaymentMethod(paymentMethod) {
    const base = ['upi', 'cod'];
    if (hasRazorpayKeys) base.push('razorpay');
    // Stripe not implemented; exclude for now
    return base.includes(paymentMethod);
  }
}

module.exports = new PaymentService();
