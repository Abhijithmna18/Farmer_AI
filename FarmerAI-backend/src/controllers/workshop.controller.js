// src/controllers/workshop.controller.js
const Workshop = require('../models/Workshop');
const WorkshopSubscription = require('../models/WorkshopSubscription');
const { createOrder } = require('../config/razorpay');
const { deleteFile, getFileUrl } = require('../middlewares/imageUpload.middleware');
const path = require('path');
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
    
    // Transform workshops to include isFree field and YouTube data for frontend compatibility
    const transformedWorkshops = workshops.map(workshop => {
      const workshopObj = workshop.toObject();
      const youtubeVideoId = workshop.getYouTubeVideoId();
      const youtubeThumbnail = workshop.getYouTubeThumbnail();
      
      return {
        ...workshopObj,
        isFree: !workshop.isPremium,
        youtubeVideoId,
        youtubeThumbnail,
        // Use YouTube thumbnail as fallback if no custom thumbnail
        thumbnail: workshopObj.thumbnail || youtubeThumbnail || '/default-workshop.png'
      };
    });
    
    res.json({
      success: true,
      data: transformedWorkshops,
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
    
    // Transform workshop to include isFree field and YouTube data for frontend compatibility
    const workshopObj = workshop.toObject();
    const youtubeVideoId = workshop.getYouTubeVideoId();
    const youtubeThumbnail = workshop.getYouTubeThumbnail();
    
    const transformedWorkshop = {
      ...workshopObj,
      isFree: !workshop.isPremium,
      youtubeVideoId,
      youtubeThumbnail,
      // Use YouTube thumbnail as fallback if no custom thumbnail
      thumbnail: workshopObj.thumbnail || youtubeThumbnail || '/default-workshop.png'
    };
    
    res.json({
      success: true,
      data: transformedWorkshop
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
    if (!workshop.isPremium) {
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

// Create workshop (Admin only)
const createWorkshop = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      duration,
      category,
      level,
      isPremium,
      price,
      tags,
      instructorName,
      instructorBio,
      instructorAvatar,
      learningOutcomes,
      prerequisites,
      materials
    } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Thumbnail image is required'
      });
    }

    const thumbnailUrl = getFileUrl(req, req.file.filename, 'workshops');

    const workshop = new Workshop({
      title,
      description,
      thumbnail: thumbnailUrl,
      videoUrl,
      duration: parseInt(duration),
      category,
      level,
      isPremium: isPremium === 'true',
      price: isPremium === 'true' ? parseInt(price) : 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      instructor: {
        name: instructorName,
        bio: instructorBio,
        avatar: instructorAvatar
      },
      learningOutcomes: learningOutcomes ? learningOutcomes.split(',').map(outcome => outcome.trim()) : [],
      prerequisites: prerequisites ? prerequisites.split(',').map(prereq => prereq.trim()) : [],
      materials: materials ? JSON.parse(materials) : []
    });

    await workshop.save();

    res.status(201).json({
      success: true,
      message: 'Workshop created successfully',
      data: workshop
    });
  } catch (error) {
    logger.error('Error creating workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create workshop',
      error: error.message
    });
  }
};

// Update workshop (Admin only)
const updateWorkshop = async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      duration,
      category,
      level,
      isPremium,
      price,
      tags,
      instructorName,
      instructorBio,
      instructorAvatar,
      learningOutcomes,
      prerequisites,
      materials,
      isActive
    } = req.body;

    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    // Handle thumbnail update
    let thumbnail = workshop.thumbnail;
    if (req.file) {
      // Delete old thumbnail
      const oldThumbnailPath = path.join(__dirname, '../../uploads/workshops', path.basename(workshop.thumbnail));
      deleteFile(oldThumbnailPath);
      
      // Set new thumbnail
      thumbnail = getFileUrl(req, req.file.filename, 'workshops');
    }

    const updateData = {
      title: title || workshop.title,
      description: description || workshop.description,
      thumbnail,
      videoUrl: videoUrl || workshop.videoUrl,
      duration: duration ? parseInt(duration) : workshop.duration,
      category: category || workshop.category,
      level: level || workshop.level,
      isPremium: isPremium !== undefined ? isPremium === 'true' : workshop.isPremium,
      price: isPremium === 'true' ? parseInt(price) : 0,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : workshop.tags,
      instructor: {
        name: instructorName || workshop.instructor.name,
        bio: instructorBio || workshop.instructor.bio,
        avatar: instructorAvatar || workshop.instructor.avatar
      },
      learningOutcomes: learningOutcomes ? learningOutcomes.split(',').map(outcome => outcome.trim()) : workshop.learningOutcomes,
      prerequisites: prerequisites ? prerequisites.split(',').map(prereq => prereq.trim()) : workshop.prerequisites,
      materials: materials ? JSON.parse(materials) : workshop.materials,
      isActive: isActive !== undefined ? isActive === 'true' : workshop.isActive
    };

    const updatedWorkshop = await Workshop.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: 'Workshop updated successfully',
      data: updatedWorkshop
    });
  } catch (error) {
    logger.error('Error updating workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update workshop',
      error: error.message
    });
  }
};

// Delete workshop (Admin only)
const deleteWorkshop = async (req, res) => {
  try {
    const workshop = await Workshop.findById(req.params.id);
    if (!workshop) {
      return res.status(404).json({
        success: false,
        message: 'Workshop not found'
      });
    }

    // Delete associated thumbnail file
    const thumbnailPath = path.join(__dirname, '../../uploads/workshops', path.basename(workshop.thumbnail));
    deleteFile(thumbnailPath);

    await Workshop.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Workshop deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting workshop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete workshop',
      error: error.message
    });
  }
};

module.exports = {
  getAllWorkshops,
  getWorkshopById,
  createWorkshop,
  updateWorkshop,
  deleteWorkshop,
  createWorkshopSubscriptionOrder,
  verifyWorkshopSubscriptionPayment,
  getUserSubscriptions,
  checkWorkshopAccess
};