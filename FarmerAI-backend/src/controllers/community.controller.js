const logger = require('../utils/logger');
const CommunityJoinRequest = require('../models/CommunityJoinRequest');
const CommunityMembers = require('../models/CommunityMembers');
const User = require('../models/User');
const { sendEmail } = require('../services/email.service');

// Dummy controller functions for community routes
// These will be replaced with real database operations later

// Posts functions
const getAllPosts = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy posts data",
      posts: [
        {
          id: 1,
          title: "Sample Post 1",
          content: "This is a dummy post for testing",
          author: "Test User",
          category: "Crop-Specific Questions",
          createdAt: new Date()
        },
        {
          id: 2,
          title: "Sample Post 2", 
          content: "Another dummy post for testing",
          author: "Test User 2",
          category: "Pest & Disease Control",
          createdAt: new Date()
        }
      ]
    });
  } catch (error) {
    logger.error('Error in getAllPosts:', error);
    next(error);
  }
};

const getApprovedPosts = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy approved posts data",
      posts: []
    });
  } catch (error) {
    logger.error('Error in getApprovedPosts:', error);
    next(error);
  }
};

const getPendingPosts = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy pending posts data",
      posts: []
    });
  } catch (error) {
    logger.error('Error in getPendingPosts:', error);
    next(error);
  }
};

const getMyPosts = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy my posts data",
      posts: []
    });
  } catch (error) {
    logger.error('Error in getMyPosts:', error);
    next(error);
  }
};

const getPostById = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post details",
      post: {
        id: req.params.id,
        title: "Sample Post",
        content: "This is a dummy post detail",
        author: "Test User",
        category: "Crop-Specific Questions",
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in getPostById:', error);
    next(error);
  }
};

const createPost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post created",
      post: {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in createPost:', error);
    next(error);
  }
};

const updatePost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post updated",
      post: {
        id: req.params.id,
      ...req.body,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in updatePost:', error);
    next(error);
  }
};

const deletePost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post deleted"
    });
  } catch (error) {
    logger.error('Error in deletePost:', error);
    next(error);
  }
};

// Comments functions
const getPostComments = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comments data",
      comments: []
    });
  } catch (error) {
    logger.error('Error in getPostComments:', error);
    next(error);
  }
};

const getPendingComments = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy pending comments data",
      comments: []
    });
  } catch (error) {
    logger.error('Error in getPendingComments:', error);
    next(error);
  }
};

const getMyComments = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy my comments data",
      comments: []
    });
  } catch (error) {
    logger.error('Error in getMyComments:', error);
    next(error);
  }
};

const createComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment added",
      comment: {
        id: Date.now(),
        postId: req.params.postId,
      ...req.body,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in createComment:', error);
    next(error);
  }
};

const updateComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment updated",
      comment: {
        id: req.params.id,
        ...req.body,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in updateComment:', error);
    next(error);
  }
};

const deleteComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment deleted"
    });
  } catch (error) {
    logger.error('Error in deleteComment:', error);
    next(error);
  }
};

// Voting functions
const upvotePost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post upvoted",
      voteCount: 1
    });
  } catch (error) {
    logger.error('Error in upvotePost:', error);
    next(error);
  }
};

const downvotePost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post downvoted",
      voteCount: -1
    });
  } catch (error) {
    logger.error('Error in downvotePost:', error);
    next(error);
  }
};

const upvoteComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment upvoted",
      voteCount: 1
    });
  } catch (error) {
    logger.error('Error in upvoteComment:', error);
    next(error);
  }
};

const downvoteComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment downvoted",
      voteCount: -1
    });
  } catch (error) {
    logger.error('Error in downvoteComment:', error);
    next(error);
  }
};

// Events functions
const getApprovedEvents = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy approved events data",
      events: []
    });
  } catch (error) {
    logger.error('Error in getApprovedEvents:', error);
    next(error);
  }
};

const getPendingEvents = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy pending events data",
      events: []
    });
  } catch (error) {
    logger.error('Error in getPendingEvents:', error);
    next(error);
  }
};

const getMyEvents = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy my events data",
      events: []
    });
  } catch (error) {
    logger.error('Error in getMyEvents:', error);
    next(error);
  }
};

const getEventById = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event details",
      event: {
        id: req.params.id,
        title: "Sample Event",
        description: "This is a dummy event",
        startDate: new Date(),
        location: "Sample Location"
      }
    });
  } catch (error) {
    logger.error('Error in getEventById:', error);
    next(error);
  }
};

const createEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event created",
      event: {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in createEvent:', error);
    next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event updated",
      event: {
        id: req.params.id,
      ...req.body,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in updateEvent:', error);
    next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event deleted"
    });
  } catch (error) {
    logger.error('Error in deleteEvent:', error);
    next(error);
  }
};

const registerForEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event registration successful"
    });
  } catch (error) {
    logger.error('Error in registerForEvent:', error);
    next(error);
  }
};

const unregisterFromEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event unregistration successful"
    });
  } catch (error) {
    logger.error('Error in unregisterFromEvent:', error);
    next(error);
  }
};

// Profiles functions
const getApprovedProfiles = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy approved profiles data",
      profiles: []
    });
  } catch (error) {
    logger.error('Error in getApprovedProfiles:', error);
    next(error);
  }
};

const getPendingProfiles = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy pending profiles data",
      profiles: []
    });
  } catch (error) {
    logger.error('Error in getPendingProfiles:', error);
    next(error);
  }
};

const getMyProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy my profile data",
      profile: {
        id: 1,
        displayName: "Test User",
        bio: "This is a dummy profile",
        location: "Test Location"
      }
    });
  } catch (error) {
    logger.error('Error in getMyProfile:', error);
    next(error);
  }
};

const getProfileById = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile details",
      profile: {
        id: req.params.id,
        displayName: "Test User",
        bio: "This is a dummy profile detail",
        location: "Test Location"
      }
    });
  } catch (error) {
    logger.error('Error in getProfileById:', error);
    next(error);
  }
};

const createProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile created",
      profile: {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in createProfile:', error);
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile updated",
      profile: {
        id: req.params.id,
        ...req.body,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    next(error);
  }
};

// Search function
const searchContent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy search results",
      results: [],
      query: req.query.q
    });
  } catch (error) {
    logger.error('Error in searchContent:', error);
    next(error);
  }
};

// Reports functions
const createReport = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy report created",
      report: {
        id: Date.now(),
        ...req.body,
        createdAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in createReport:', error);
    next(error);
  }
};

const getReports = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy reports data",
      reports: []
    });
  } catch (error) {
    logger.error('Error in getReports:', error);
    next(error);
  }
};

const updateReport = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy report updated",
      report: {
        id: req.params.id,
      ...req.body,
        updatedAt: new Date()
      }
    });
  } catch (error) {
    logger.error('Error in updateReport:', error);
    next(error);
  }
};

// Admin approval functions
const approvePost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post approved"
    });
  } catch (error) {
    logger.error('Error in approvePost:', error);
    next(error);
  }
};

const rejectPost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post rejected"
    });
  } catch (error) {
    logger.error('Error in rejectPost:', error);
    next(error);
  }
};

const editPost = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy post edited and approved"
    });
  } catch (error) {
    logger.error('Error in editPost:', error);
    next(error);
  }
};

const approveComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment approved"
    });
  } catch (error) {
    logger.error('Error in approveComment:', error);
    next(error);
  }
};

const rejectComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment rejected"
    });
  } catch (error) {
    logger.error('Error in rejectComment:', error);
    next(error);
  }
};

const editComment = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy comment edited and approved"
    });
  } catch (error) {
    logger.error('Error in editComment:', error);
    next(error);
  }
};

const approveEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event approved"
    });
  } catch (error) {
    logger.error('Error in approveEvent:', error);
    next(error);
  }
};

const rejectEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event rejected"
    });
  } catch (error) {
    logger.error('Error in rejectEvent:', error);
    next(error);
  }
};

const editEvent = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy event edited and approved"
    });
  } catch (error) {
    logger.error('Error in editEvent:', error);
    next(error);
  }
};

const approveProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile approved"
    });
  } catch (error) {
    logger.error('Error in approveProfile:', error);
    next(error);
  }
};

const rejectProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile rejected"
    });
  } catch (error) {
    logger.error('Error in rejectProfile:', error);
    next(error);
  }
};

const suspendProfile = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy profile suspended"
    });
  } catch (error) {
    logger.error('Error in suspendProfile:', error);
    next(error);
  }
};

// Admin dashboard functions
const getAdminDashboard = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy admin dashboard data",
      dashboard: {
        pendingCounts: {
          posts: 0,
          comments: 0,
          events: 0,
          profiles: 0,
          reports: 0
        },
        recentSubmissions: {
          posts: [],
          events: [],
          profiles: []
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAdminDashboard:', error);
    next(error);
  }
};

const getAdminStats = async (req, res, next) => {
  try {
    res.json({
      success: true,
      message: "Dummy admin stats data",
      stats: {
        totalPosts: 0,
        approvedPosts: 0,
        pendingPosts: 0,
        totalComments: 0,
        approvedComments: 0,
        pendingComments: 0,
        totalEvents: 0,
        approvedEvents: 0,
        pendingEvents: 0,
        totalProfiles: 0,
        approvedProfiles: 0,
        pendingProfiles: 0,
        totalReports: 0,
        pendingReports: 0
      }
    });
  } catch (error) {
    logger.error('Error in getAdminStats:', error);
    next(error);
  }
};

// Join request functions
const submitJoinRequest = async (req, res, next) => {
  try {
    const { fullName, email, district, state, crops, yearsOfExperience, phone, bio } = req.body;
    
    // Validate required fields
    if (!fullName || !email || !district || !state || !crops || !yearsOfExperience) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be provided'
      });
    }
    
    // Check if email already exists in CommunityMembers
    const existingMember = await CommunityMembers.findOne({ email });
    if (existingMember) {
      return res.status(400).json({
        success: false,
        message: 'A community join request with this email already exists'
      });
    }
    
    // Check if user already exists in User table
    const existingUser = await User.findOne({ email });
    
    const communityMember = new CommunityMembers({
      userId: existingUser ? existingUser._id : null, // Link to existing user if found
      name: fullName,
      email,
      location: {
        district,
        state
      },
      farmingDetails: {
        crops: JSON.parse(crops),
        yearsOfExperience: parseInt(yearsOfExperience),
        bio
      },
      profilePhoto: req.file ? req.file.path : null,
      phone,
      status: 'pending'
    });
    
    await communityMember.save();
    
    res.status(201).json({
      success: true,
      message: 'Join request submitted successfully. You will receive an email confirmation once approved.',
      requestId: communityMember._id,
      existingUser: !!existingUser
    });
  } catch (error) {
    logger.error('Error submitting join request:', error);
    next(error);
  }
};

const getUserApprovalStatus = async (req, res, next) => {
  try {
    const userEmail = req.user.email;
    
    const communityMember = await CommunityMembers.findOne({ email: userEmail });
    
    if (!communityMember) {
      return res.json({
        success: true,
        status: null,
        message: 'No community join request found'
      });
    }
    
    res.json({
      success: true,
      status: communityMember.status,
      request: {
        id: communityMember._id,
        status: communityMember.status,
        submittedAt: communityMember.createdAt,
        rejectionReason: communityMember.rejectionReason,
        approvedAt: communityMember.approvedAt
      }
    });
  } catch (error) {
    logger.error('Error getting user approval status:', error);
    next(error);
  }
};

const getPendingJoinRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;
    
    const requests = await CommunityMembers.find({ status: 'pending' })
      .populate('userId', 'name email photoURL')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CommunityMembers.countDocuments({ status: 'pending' });
    
    res.json({
      success: true,
      requests,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching pending join requests:', error);
    next(error);
  }
};

// New function to get all community requests with filters
const getAllCommunityRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    const requests = await CommunityMembers.find(filter)
      .populate('userId', 'name email photoURL')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await CommunityMembers.countDocuments(filter);
    
    // Get status counts
    const statusCounts = await CommunityMembers.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const counts = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: total
    };
    
    statusCounts.forEach(item => {
      counts[item._id] = item.count;
    });

    res.json({
      success: true,
      requests,
      counts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    logger.error('Error fetching community requests:', error);
    next(error);
  }
};

const approveJoinRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const communityMember = await CommunityMembers.findById(id);
    
    if (!communityMember) {
      return res.status(404).json({
        success: false,
        message: 'Community join request not found'
      });
    }
    
    if (communityMember.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Community join request is not pending approval'
      });
    }
    
    let userAccount = null;
    
    // If user doesn't have an account, create one
    if (!communityMember.userId) {
      userAccount = new User({
        name: communityMember.name,
        email: communityMember.email,
        firstName: communityMember.name.split(' ')[0],
        lastName: communityMember.name.split(' ').slice(1).join(' ') || '',
        location: `${communityMember.location.district}, ${communityMember.location.state}`,
        district: communityMember.location.district,
        state: communityMember.location.state,
        crops: communityMember.farmingDetails.crops,
        yearsOfExperience: communityMember.farmingDetails.yearsOfExperience,
        phone: communityMember.phone,
        bio: communityMember.farmingDetails.bio,
        photoURL: communityMember.profilePhoto,
        roles: ['farmer'],
        verified: true
      });
      
      await userAccount.save();
    } else {
      // User already exists, just update their community access
      userAccount = await User.findById(communityMember.userId);
      if (userAccount) {
        userAccount.roles = userAccount.roles || [];
        if (!userAccount.roles.includes('farmer')) {
          userAccount.roles.push('farmer');
        }
        await userAccount.save();
      }
    }
    
    // Update community member status
    communityMember.status = 'approved';
    communityMember.approvedBy = req.user.id;
    communityMember.approvedAt = new Date();
    communityMember.userAccountCreated = !communityMember.userId;
    communityMember.createdUserId = userAccount ? userAccount._id : communityMember.userId;
    
    await communityMember.save();
    
    // Send welcome email
    try {
      const subject = 'Welcome to FarmerAI Community – Access Granted';
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Welcome to FarmerAI Community!</h2>
          <p>Hello ${communityMember.name},</p>
          <p>Great news! Your request to join the FarmerAI Community has been approved. You now have full access to our farming community platform.</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="color: #4CAF50; margin-top: 0;">What you can do now:</h3>
            <ul>
              <li>Participate in discussions and share your farming knowledge</li>
              <li>Ask questions and get advice from experienced farmers</li>
              <li>Join events and workshops</li>
              <li>Connect with farmers in your area</li>
              <li>Access exclusive farming resources and tips</li>
              <li>Create and manage your farming profile</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173/community" 
               style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Access the Community
            </a>
          </div>
          
          <p>Thank you for joining our farming community. We're excited to have you on board!</p>
          <p>Best regards,<br>The FarmerAI Team</p>
        </div>
      `;
      
      await sendEmail(communityMember.email, subject, html);
      logger.info(`Welcome email sent to ${communityMember.email}`);
    } catch (emailError) {
      logger.error('Error sending welcome email:', emailError);
      // Don't fail the approval if email fails
    }
    
    res.json({
      success: true,
      message: 'Community join request approved successfully. Welcome email sent.',
      user: {
        id: userAccount ? userAccount._id : communityMember.userId,
        name: communityMember.name,
        email: communityMember.email,
        existingUser: !!communityMember.userId
      }
    });
  } catch (error) {
    logger.error('Error approving community join request:', error);
    next(error);
  }
};

const rejectJoinRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const communityMember = await CommunityMembers.findById(id);
    
    if (!communityMember) {
      return res.status(404).json({
        success: false,
        message: 'Community join request not found'
      });
    }
    
    if (communityMember.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Community join request is not pending approval'
      });
    }
    
    communityMember.status = 'rejected';
    communityMember.rejectionReason = rejectionReason || 'Request not approved';
    
    await communityMember.save();

    res.json({
      success: true,
      message: 'Community join request rejected successfully'
    });
  } catch (error) {
    logger.error('Error rejecting community join request:', error);
    next(error);
  }
};

// Export all functions
module.exports = {
  // Posts
  getAllPosts,
  getApprovedPosts,
  getPendingPosts,
  getMyPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  
  // Comments
  getPostComments,
  getPendingComments,
  getMyComments,
  createComment,
  updateComment,
  deleteComment,
  
  // Voting
  upvotePost,
  downvotePost,
  upvoteComment,
  downvoteComment,
  
  // Events
  getApprovedEvents,
  getPendingEvents,
  getMyEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  registerForEvent,
  unregisterFromEvent,
  
  // Profiles
  getApprovedProfiles,
  getPendingProfiles,
  getMyProfile,
  getProfileById,
  createProfile,
  updateProfile,
  
  // Search
  searchContent,
  
  // Reports
  createReport,
  getReports,
  updateReport,
  
  // Admin approval
  approvePost,
  rejectPost,
  editPost,
  approveComment,
  rejectComment,
  editComment,
  approveEvent,
  rejectEvent,
  editEvent,
  approveProfile,
  rejectProfile,
  suspendProfile,
  
  // Admin dashboard
  getAdminDashboard,
  getAdminStats,
  
  // Join request functions
  submitJoinRequest,
  getUserApprovalStatus,
  getPendingJoinRequests,
  getAllCommunityRequests,
  approveJoinRequest,
  rejectJoinRequest
};