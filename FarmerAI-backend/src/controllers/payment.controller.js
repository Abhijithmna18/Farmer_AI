const paymentService = require('../services/payment.service');
const Order = require('../models/Order');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const logger = require('../utils/logger');

// Create payment order
exports.createPaymentOrder = async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    const userId = req.user.id;

    // Validate payment method
    if (!paymentService.validatePaymentMethod(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment method'
      });
    }

    // Get order details
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user owns this order
    if (order.buyer.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Check if order is in valid state for payment
    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Order is not in pending state'
      });
    }

    // Calculate fees
    const fees = paymentService.calculatePaymentFees(order.totalAmount, paymentMethod);

    let paymentResult;

    switch (paymentMethod) {
      case 'razorpay':
        paymentResult = await paymentService.createRazorpayOrder(
          order.totalAmount,
          'INR',
          order.orderNumber,
          userId
        );
        break;
      case 'upi':
        paymentResult = await paymentService.createUPIPaymentLink(
          order.totalAmount,
          order.orderNumber,
          userId
        );
        break;
      case 'cod':
        paymentResult = await paymentService.processCOD(
          order.orderNumber,
          order.totalAmount
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Payment method not supported yet'
        });
    }

    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: paymentResult.error
      });
    }

    // Create transaction record
    const transaction = new Transaction({
      orderNumber: order.orderNumber,
      buyer: userId,
      farmer: order.farmer,
      amount: order.totalAmount,
      paymentMethod: paymentMethod,
      status: paymentMethod === 'cod' ? 'pending' : 'processing',
      gatewayResponse: paymentResult.data,
      fees: fees
    });

    await transaction.save();

    // Update order with payment information
    order.paymentMethod = paymentMethod;
    order.paymentId = transaction.transactionId;
    order.paymentStatus = paymentMethod === 'cod' ? 'pending' : 'processing';
    await order.save();

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        transactionId: transaction.transactionId,
        paymentData: paymentResult.data,
        fees: fees
      }
    });

  } catch (error) {
    logger.error('Error creating payment order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify payment (for Razorpay)
exports.verifyPayment = async (req, res) => {
  try {
    const { transactionId, paymentData } = req.body;
    const userId = req.user.id;

    // Get transaction
    const transaction = await Transaction.findOne({ 
      transactionId: transactionId,
      buyer: userId 
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify payment based on method
    let verificationResult;

    switch (transaction.paymentMethod) {
      case 'razorpay':
        verificationResult = await paymentService.verifyRazorpayPayment(paymentData);
        break;
      case 'cod':
        // COD doesn't need verification
        verificationResult = { success: true, data: { status: 'completed' } };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Payment verification not supported for this method'
        });
    }

    if (!verificationResult.success) {
      // Update transaction as failed
      await transaction.updateStatus('failed', {
        reason: verificationResult.error
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        error: verificationResult.error
      });
    }

    // Update transaction as completed
    await transaction.updateStatus('completed', {
      gatewayResponse: verificationResult.data
    });

    // Update order status
    const order = await Order.findOne({ orderNumber: transaction.orderNumber });
    if (order) {
      order.paymentStatus = 'paid';
      order.paymentDetails = {
        transactionId: transaction.transactionId,
        gatewayResponse: verificationResult.data,
        paidAt: new Date()
      };
      await order.save();

      // Update user statistics
      await User.findByIdAndUpdate(userId, {
        $inc: { 'buyerProfile.totalPurchases': order.totalAmount }
      });
      await User.findByIdAndUpdate(order.farmer, {
        $inc: { 'farmerProfile.totalSales': order.totalAmount }
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        transactionId: transaction.transactionId,
        orderNumber: order.orderNumber,
        amount: transaction.amount,
        status: 'completed'
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

// Get payment status
exports.getPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ 
      transactionId: transactionId,
      $or: [{ buyer: userId }, { farmer: userId }]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Get latest payment details from gateway if needed
    let paymentDetails = null;
    if (transaction.paymentMethod === 'razorpay' && transaction.gatewayResponse?.paymentId) {
      const details = await paymentService.getPaymentDetails(transaction.gatewayResponse.paymentId);
      if (details.success) {
        paymentDetails = details.data;
      }
    }

    res.json({
      success: true,
      data: {
        transactionId: transaction.transactionId,
        orderNumber: transaction.orderNumber,
        amount: transaction.amount,
        status: transaction.status,
        paymentMethod: transaction.paymentMethod,
        fees: transaction.fees,
        paymentDetails: paymentDetails,
        createdAt: transaction.createdAt,
        completedAt: transaction.completedAt
      }
    });

  } catch (error) {
    logger.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment status',
      error: error.message
    });
  }
};

// Process refund
exports.processRefund = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { amount, reason } = req.body;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ 
      transactionId: transactionId,
      farmer: userId // Only farmers can process refunds
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Can only refund completed transactions'
      });
    }

    if (amount > transaction.amount) {
      return res.status(400).json({
        success: false,
        message: 'Refund amount cannot exceed transaction amount'
      });
    }

    let refundResult;

    switch (transaction.paymentMethod) {
      case 'razorpay':
        if (!transaction.gatewayResponse?.paymentId) {
          return res.status(400).json({
            success: false,
            message: 'Payment ID not found for refund'
          });
        }
        refundResult = await paymentService.refundPayment(
          transaction.gatewayResponse.paymentId,
          amount,
          reason
        );
        break;
      case 'cod':
        // For COD, we just mark as refunded
        refundResult = { 
          success: true, 
          data: { 
            refundId: `COD_REFUND_${transactionId}_${Date.now()}`,
            status: 'completed'
          } 
        };
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Refund not supported for this payment method'
        });
    }

    if (!refundResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to process refund',
        error: refundResult.error
      });
    }

    // Update transaction with refund information
    await transaction.processRefund(amount, reason, refundResult.data.refundId);

    // Update order status
    const order = await Order.findOne({ orderNumber: transaction.orderNumber });
    if (order) {
      order.refund = {
        amount: amount,
        reason: reason,
        status: 'processed',
        processedAt: new Date()
      };
      order.status = amount === transaction.amount ? 'refunded' : 'partially_refunded';
      await order.save();
    }

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        refundId: refundResult.data.refundId,
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

// Get user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status, userType = 'buyer' } = req.query;

    const filter = {};
    if (userType === 'buyer') {
      filter.buyer = userId;
    } else if (userType === 'farmer') {
      filter.farmer = userId;
    } else {
      filter.$or = [{ buyer: userId }, { farmer: userId }];
    }

    if (status) {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const transactions = await Transaction.find(filter)
      .populate([
        { path: 'buyer', select: 'name email' },
        { path: 'farmer', select: 'name email farmerProfile.farmName' }
      ])
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(filter);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalTransactions: total
        }
      }
    });

  } catch (error) {
    logger.error('Error fetching user transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
};

// Get transaction statistics
exports.getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'month' } = req.query;

    const buyerStats = await Transaction.getTransactionStats(userId, 'buyer', period);
    const farmerStats = await Transaction.getTransactionStats(userId, 'farmer', period);

    res.json({
      success: true,
      data: {
        buyer: buyerStats,
        farmer: farmerStats
      }
    });

  } catch (error) {
    logger.error('Error fetching transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
};
