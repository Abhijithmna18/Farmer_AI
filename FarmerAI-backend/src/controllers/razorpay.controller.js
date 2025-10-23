// src/controllers/razorpay.controller.js
const { createOrder, getOrderDetails } = require('../config/razorpay');
const logger = require('../utils/logger');

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = 'INR', bookingId } = req.body;

    if (!amount || !bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Amount and bookingId are required'
      });
    }

    // Frontend already sends amount in paise, so we pass it directly
    // Do NOT multiply by 100 here as createOrder will do it
    // Actually, we need to divide by 100 since frontend multiplied it
    const amountInRupees = amount / 100;
    
    logger.info(`Creating Razorpay order for booking ${bookingId}: Rs ${amountInRupees} (${amount} paise)`);
    
    const order = await createOrder(amountInRupees, currency, `booking_${bookingId}`);

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt
      }
    });

  } catch (error) {
    logger.error('Error creating Razorpay order:', error);
    logger.error('Error details:', {
      message: error.message,
      description: error.error?.description,
      code: error.error?.code,
      statusCode: error.statusCode,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
      error: error.message,
      details: error.error?.description || error.message
    });
  }
};

// Get order details
const getRazorpayOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }

    const order = await getOrderDetails(orderId);

    res.json({
      success: true,
      data: order
    });

  } catch (error) {
    logger.error('Error fetching Razorpay order details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details',
      error: error.message
    });
  }
};

module.exports = {
  createRazorpayOrder,
  getRazorpayOrderDetails
};


