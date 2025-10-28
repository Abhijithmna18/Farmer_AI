const logger = require('../utils/logger');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/feedback-attachments/';
    // Skip directory creation in serverless environments
    if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed'), false);
    }
  }
});

// Create feedback (Farmer's action)
const createFeedback = async (req, res, next) => {
  try {
    const { type, subject, description, priority = 'Medium' } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!type || !subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Type, subject, and description are required'
      });
    }

    const feedback = new Feedback({
      userId,
      type,
      subject,
      description,
      priority,
      attachment: req.file ? req.file.path : null
    });

    await feedback.save();
    await feedback.populate('userId', 'name email photoURL');

    logger.info(`New feedback created by user ${userId}: ${feedback._id}`);

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    logger.error('Error creating feedback:', error);
    next(error);
  }
};

// Get user's own feedback (Farmer's view)
const getUserFeedback = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = { userId };
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }

    const feedback = await Feedback.find(filter)
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    res.json({
      success: true,
      feedback,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching user feedback:', error);
    next(error);
  }
};

// Get all feedback (Admin's view)
const getAllFeedback = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type, priority, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    if (type && type !== 'all') {
      filter.type = type;
    }
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    if (search) {
      filter.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const feedback = await Feedback.find(filter)
      .populate('userId', 'name email photoURL')
      .populate('assignedTo', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Feedback.countDocuments(filter);

    // Get status counts for dashboard
    const statusCounts = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const counts = {
      received: 0,
      inProgress: 0,
      completed: 0,
      total: total
    };

    statusCounts.forEach(item => {
      const status = item._id.toLowerCase().replace(' ', '');
      if (status === 'inprogress') {
        counts.inProgress = item.count;
      } else if (status === 'completed') {
        counts.completed = item.count;
      } else if (status === 'received') {
        counts.received = item.count;
      }
    });

    res.json({
      success: true,
      feedback,
      counts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching all feedback:', error);
    next(error);
  }
};

// Get single feedback by ID
const getFeedbackById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const feedback = await Feedback.findById(id)
      .populate('userId', 'name email photoURL')
      .populate('assignedTo', 'name email');

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Check if user can access this feedback
    if (userRole !== 'admin' && feedback.userId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    logger.error('Error fetching feedback by ID:', error);
    next(error);
  }
};

// Update feedback (Admin's action)
const updateFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, farmerComment, adminComment, priority, assignedTo } = req.body;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Update fields
    if (status) feedback.status = status;
    if (adminNotes !== undefined) feedback.adminNotes = adminNotes;
    if (farmerComment !== undefined) feedback.farmerComment = farmerComment;
    if (adminComment !== undefined) feedback.adminComment = adminComment;
    if (priority) feedback.priority = priority;
    if (assignedTo) feedback.assignedTo = assignedTo;

    // Set resolved date if status is completed
    if (status === 'Completed' && !feedback.resolvedAt) {
      feedback.resolvedAt = new Date();
    }

    await feedback.save();
    await feedback.populate('userId', 'name email photoURL');
    await feedback.populate('assignedTo', 'name email');

    logger.info(`Feedback ${id} updated by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Feedback updated successfully',
      feedback
    });
  } catch (error) {
    logger.error('Error updating feedback:', error);
    next(error);
  }
};

// Delete feedback (Admin's action)
const deleteFeedback = async (req, res, next) => {
  try {
    const { id } = req.params;

    const feedback = await Feedback.findById(id);
    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: 'Feedback not found'
      });
    }

    // Delete attachment file if exists
    if (feedback.attachment && fs.existsSync(feedback.attachment)) {
      fs.unlinkSync(feedback.attachment);
    }

    await Feedback.findByIdAndDelete(id);

    logger.info(`Feedback ${id} deleted by admin ${req.user.id}`);

    res.json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting feedback:', error);
    next(error);
  }
};

// Get feedback statistics for admin dashboard
const getFeedbackStats = async (req, res, next) => {
  try {
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          received: { $sum: { $cond: [{ $eq: ['$status', 'Received'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
          bugReports: { $sum: { $cond: [{ $eq: ['$type', 'Bug Report'] }, 1, 0] } },
          featureSuggestions: { $sum: { $cond: [{ $eq: ['$type', 'Feature Suggestion'] }, 1, 0] } },
          generalComments: { $sum: { $cond: [{ $eq: ['$type', 'General Comment'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      received: 0,
      inProgress: 0,
      completed: 0,
      bugReports: 0,
      featureSuggestions: 0,
      generalComments: 0
    };

    res.json({
      success: true,
      stats: result
    });
  } catch (error) {
    logger.error('Error fetching feedback stats:', error);
    next(error);
  }
};

// Get feedback analytics for user
const getFeedbackAnalytics = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's feedback statistics
    const totalFeedback = await Feedback.countDocuments({ userId });
    const completedFeedback = await Feedback.countDocuments({ 
      userId, 
      status: 'Completed' 
    });
    const inProgressFeedback = await Feedback.countDocuments({ 
      userId, 
      status: 'In Progress' 
    });
    const receivedFeedback = await Feedback.countDocuments({ 
      userId, 
      status: 'Received' 
    });

    // Calculate average response time
    const completedFeedbacks = await Feedback.find({ 
      userId, 
      status: 'Completed',
      updatedAt: { $exists: true }
    }).select('createdAt updatedAt');

    let avgResponseTime = 0;
    if (completedFeedbacks.length > 0) {
      const totalResponseTime = completedFeedbacks.reduce((sum, feedback) => {
        const responseTime = new Date(feedback.updatedAt) - new Date(feedback.createdAt);
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / completedFeedbacks.length / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Get status distribution
    const statusDistribution = await Feedback.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get type distribution
    const typeDistribution = await Feedback.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get recent activity
    const recentActivity = await Feedback.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('subject description status createdAt type');

    res.json({
      success: true,
      analytics: {
        totalFeedback,
        completedFeedback,
        inProgressFeedback,
        receivedFeedback,
        avgResponseTime,
        satisfactionRate: completedFeedback > 0 ? Math.round((completedFeedback / totalFeedback) * 100) : 0,
        statusDistribution,
        typeDistribution,
        recentActivity: recentActivity.map(activity => ({
          subject: activity.subject,
          description: activity.description.substring(0, 100) + '...',
          status: activity.status,
          type: activity.type,
          date: activity.createdAt.toLocaleDateString()
        }))
      }
    });
  } catch (error) {
    logger.error('Error fetching feedback analytics:', error);
    next(error);
  }
};

// Get feedback analytics for admin
const getAdminFeedbackAnalytics = async (req, res, next) => {
  try {
    // Get overall statistics
    const totalFeedback = await Feedback.countDocuments();
    const completedFeedback = await Feedback.countDocuments({ status: 'Completed' });
    const inProgressFeedback = await Feedback.countDocuments({ status: 'In Progress' });
    const receivedFeedback = await Feedback.countDocuments({ status: 'Received' });

    // Calculate average response time
    const completedFeedbacks = await Feedback.find({ 
      status: 'Completed',
      updatedAt: { $exists: true }
    }).select('createdAt updatedAt');

    let avgResponseTime = 0;
    if (completedFeedbacks.length > 0) {
      const totalResponseTime = completedFeedbacks.reduce((sum, feedback) => {
        const responseTime = new Date(feedback.updatedAt) - new Date(feedback.createdAt);
        return sum + responseTime;
      }, 0);
      avgResponseTime = Math.round(totalResponseTime / completedFeedbacks.length / (1000 * 60 * 60 * 24)); // Convert to days
    }

    // Get status distribution
    const statusDistribution = await Feedback.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get type distribution
    const typeDistribution = await Feedback.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]);

    // Get active users (users who have submitted feedback)
    const activeUsers = await Feedback.distinct('userId');

    // Calculate resolution rate
    const resolutionRate = totalFeedback > 0 ? Math.round((completedFeedback / totalFeedback) * 100) : 0;

    res.json({
      success: true,
      analytics: {
        totalFeedback,
        completedFeedback,
        inProgressFeedback,
        receivedFeedback,
        avgResponseTime,
        satisfactionRate: 85, // Placeholder - would need user rating system
        activeUsers: activeUsers.length,
        resolutionRate,
        statusDistribution,
        typeDistribution
      }
    });
  } catch (error) {
    logger.error('Error fetching admin feedback analytics:', error);
    next(error);
  }
};

// Get feedback notifications for user
const getFeedbackNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Get user's recent feedback with status changes
    const recentFeedback = await Feedback.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(10)
      .select('subject status adminComment updatedAt createdAt type priority');

    // Generate mock notifications based on feedback status
    const notifications = recentFeedback.map((feedback, index) => {
      const isNew = new Date(feedback.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      const hasUpdate = new Date(feedback.updatedAt) > new Date(feedback.createdAt);
      
      let notification = {
        id: `notification-${feedback._id}-${index}`,
        type: 'status_update',
        title: 'Feedback Update',
        message: `Your feedback "${feedback.subject}" status has been updated to ${feedback.status}`,
        feedbackSubject: feedback.subject,
        priority: feedback.priority.toLowerCase(),
        createdAt: feedback.updatedAt,
        read: false
      };

      if (isNew) {
        notification.type = 'response_received';
        notification.title = 'New Feedback Submitted';
        notification.message = `Your feedback "${feedback.subject}" has been received and is being reviewed`;
        notification.createdAt = feedback.createdAt;
      } else if (hasUpdate && feedback.adminComment) {
        notification.type = 'response_received';
        notification.title = 'Admin Response';
        notification.message = `You have received a response for your feedback "${feedback.subject}"`;
      }

      return notification;
    });

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    logger.error('Error fetching feedback notifications:', error);
    next(error);
  }
};

// Get feedback notifications for admin
const getAdminFeedbackNotifications = async (req, res, next) => {
  try {
    // Get recent feedback that needs attention
    const recentFeedback = await Feedback.find({ userId: { $exists: true, $ne: null } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .select('subject status type priority createdAt userId');

    // Generate mock notifications for admin
    const notifications = recentFeedback.map((feedback, index) => {
      const isNew = new Date(feedback.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      // Handle case where userId might be null or not populated
      const userName = feedback.userId?.name || feedback.userId?.email || 'Anonymous User';
      
      let notification = {
        id: `admin-notification-${feedback._id}-${index}`,
        type: 'new_feedback',
        title: 'New Feedback Received',
        message: `${userName} submitted a new ${feedback.type.toLowerCase()}: "${feedback.subject}"`,
        feedbackSubject: feedback.subject,
        priority: feedback.priority.toLowerCase(),
        createdAt: feedback.createdAt,
        read: false
      };

      if (feedback.status === 'Received' && feedback.priority === 'Critical') {
        notification.type = 'urgent_feedback';
        notification.title = 'Urgent Feedback';
        notification.message = `Critical priority feedback from ${userName} requires immediate attention`;
      }

      return notification;
    });

    res.json({
      success: true,
      notifications
    });
  } catch (error) {
    logger.error('Error fetching admin feedback notifications:', error);
    next(error);
  }
};

module.exports = {
  createFeedback,
  getUserFeedback,
  getAllFeedback,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
  getFeedbackStats,
  getFeedbackAnalytics,
  getAdminFeedbackAnalytics,
  getFeedbackNotifications,
  getAdminFeedbackNotifications,
  upload
};



