// src/controllers/workshop.controller.js
const Workshop = require('../models/Workshop');
const WorkshopSubscription = require('../models/WorkshopSubscription');
const { createOrder } = require('../config/razorpay');
const logger = require('../utils/logger');

// Get all workshops
const getAllWorkshops = async (req, res) => {
  try {
    const { page = 1, limit = 10, category, isPremium, search } = req.query;
    
    const query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (isPremium !== undefined) {
      query.isPremium = isPremium === 'true';
    }
    
    if (search) {
      query.$text = { $search: search };
    }
    
    const workshops = await Workshop.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
      
    const total = await Workshop.countDocuments(query);
    
    res.json({
      success: true,
      data: workshops,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching workshops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshops',
      error: error.message
    });
  }
};

// Get workshop by ID
const getWorkshopById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const workshop = await Workshop.findById(id);
    
    if (!workshop || !workshop.isActive) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Increment view count
    workshop.views += 1;
    await workshop.save();
    
    res.json({
      success: true,
      data: workshop
    });
  } catch (error) {
    logger.error('Error fetching workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch workshop',
      error: error.message
    });
  }
};

// Create Razorpay order for workshop subscription
const createWorkshopSubscriptionOrder = async (req, res) => {
  try {
    // Validate request body exists
    if (!req.body) {
      return res.status(400).json({
        success: false,
        message: 'Request body is required'
      });
    }
    
    const { type = 'monthly', workshopId } = req.body;
    const userId = req.user.id;
    
    // Validate request body
    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'Subscription type is required'
      });
    }
    
    let amount, description;
    
    // Set pricing based on subscription type
    switch (type) {
      case 'monthly':
        amount = 499; // ₹499 per month
        description = 'Monthly Workshop Subscription';
        break;
      case 'yearly':
        amount = 4999; // ₹4999 per year (20% discount)
        description = 'Yearly Workshop Subscription';
        break;
      case 'workshop':
        if (!workshopId) {
          return res.status(400).json({
            success: false,
            message: 'Workshop ID is required for workshop purchase'
          });
        }
        
        const workshop = await Workshop.findById(workshopId);
        if (!workshop) {
          return res.status(404).json({
            success: false,
            message: 'Workshop not found'
          });
        }
        
        if (workshop.isFree) {
          return res.status(400).json({
            success: false,
            message: 'This workshop is free and does not require payment'
          });
        }
        
        amount = workshop.price;
        description = `Workshop: ${workshop.title}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid subscription type. Valid types are: monthly, yearly, workshop'
        });
    }
    
    // Create Razorpay order
    const order = await createOrder(amount, 'INR', `workshop_${type}_${Date.now()}`);
    
    // Create subscription record
    const subscription = new WorkshopSubscription({
      subscriptionId: WorkshopSubscription.generateSubscriptionId(),
      user: userId,
      type,
      startDate: new Date(),
      endDate: calculateEndDate(type),
      amount: {
        total: amount,
        currency: 'INR'
      },
      workshops: workshopId ? [workshopId] : [],
      status: 'pending'
    });
    
    if (workshopId) {
      subscription.workshops = [workshopId];
    }
    
    await subscription.save();
    
    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        subscriptionId: subscription.subscriptionId
      }
    });
  } catch (error) {
    logger.error('Error creating workshop subscription order:', error);
    
    // Provide more detailed error information
    if (error.message.includes('Razorpay credentials')) {
      return res.status(500).json({
        success: false,
        message: 'Payment system is currently unavailable. Please try again later.',
        error: 'Payment gateway configuration error'
      });
    }
    
    // Check if it's a network error or Razorpay API error
    if (error.response && error.response.data) {
      // This is likely a Razorpay API error
      return res.status(error.response.status || 500).json({
        success: false,
        message: 'Payment gateway error',
        error: error.response.data.error || error.response.data.message || 'Unknown Razorpay error',
        details: error.response.data
      });
    }
    
    // Generic error response
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription order',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Verify workshop subscription payment
const verifyWorkshopSubscriptionPayment = async (req, res) => {
  try {
    const { orderId, paymentId, signature, subscriptionId } = req.body;
    const userId = req.user.id;
    
    // Find subscription
    const subscription = await WorkshopSubscription.findOne({ 
      subscriptionId,
      user: userId 
    });
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }
    
    // Update subscription with payment details
    subscription.razorpay = {
      orderId,
      paymentId,
      signature
    };
    
    subscription.status = 'active';
    await subscription.save();
    
    // Get user details for email
    const User = require('../models/User');
    const user = await User.findById(userId);
    
    // Import email service
    const { sendPaymentConfirmation } = require('../services/email.service');
    
    // Send payment confirmation email
    try {
      await sendPaymentConfirmation(user.email, {
        farmerName: `${user.firstName} ${user.lastName}`,
        bookingId: subscription.subscriptionId,
        paymentId: paymentId,
        amount: subscription.amount.total,
        paymentMethod: 'Razorpay',
        paymentDate: new Date().toLocaleDateString(),
        warehouseName: 'Workshop Subscription',
        startDate: subscription.startDate.toLocaleDateString(),
        endDate: subscription.endDate.toLocaleDateString()
      });
      logger.info(`Payment confirmation email sent to ${user.email}`);
    } catch (emailError) {
      logger.error('Failed to send payment confirmation email:', emailError);
      // Don't fail the response if email fails
    }
    
    res.json({
      success: true,
      data: {
        subscriptionId: subscription.subscriptionId,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate
      }
    });
  } catch (error) {
    logger.error('Error verifying workshop subscription payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify subscription payment',
      error: error.message
    });
  }
};

// Get user's subscriptions
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const subscriptions = await WorkshopSubscription.find({ user: userId })
      .populate('workshops')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    logger.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions',
      error: error.message
    });
  }
};

// Helper function to calculate end date based on subscription type
const calculateEndDate = (type) => {
  const startDate = new Date();
  const endDate = new Date(startDate);
  
  switch (type) {
    case 'monthly':
      endDate.setMonth(endDate.getMonth() + 1);
      break;
    case 'yearly':
      endDate.setFullYear(endDate.getFullYear() + 1);
      break;
    default:
      endDate.setMonth(endDate.getMonth() + 1);
  }
  
  return endDate;
};

// Check if user has access to a workshop
const checkWorkshopAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const workshop = await Workshop.findById(id);
    
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }
    
    // Free workshops are accessible to everyone
    if (workshop.isFree) {
      return res.json({
        success: true,
        data: {
          hasAccess: true,
          reason: 'free_workshop'
        }
      });
    }
    
    // Check if user has an active subscription
    const activeSubscription = await WorkshopSubscription.findOne({
      user: userId,
      status: 'active',
      endDate: { $gte: new Date() },
      $or: [
        { type: { $in: ['monthly', 'yearly'] } }, // Any active subscription
        { workshops: id } // Specific workshop purchase
      ]
    });
    
    res.json({
      success: true,
      data: {
        hasAccess: !!activeSubscription,
        reason: activeSubscription ? 'subscription_active' : 'no_access'
      }
    });
  } catch (error) {
    logger.error('Error checking workshop access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check workshop access',
      error: error.message
    });
  }
};

module.exports = {
  getAllWorkshops,
  getWorkshopById,
  createWorkshopSubscriptionOrder,
  verifyWorkshopSubscriptionPayment,
  getUserSubscriptions,
  checkWorkshopAccess
};