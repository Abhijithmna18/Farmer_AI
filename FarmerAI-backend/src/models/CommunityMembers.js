const mongoose = require('mongoose');

const communityMembersSchema = new mongoose.Schema({
  // Reference to existing user if already registered
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Optional - for new users who don't have accounts yet
  },
  
  // Basic information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Location information
  location: {
    district: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    state: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    }
  },
  
  // Farming information
  farmingDetails: {
    crops: [{
      type: String,
      trim: true,
      maxlength: 50
    }],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    bio: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500
    }
  },
  
  // Profile information
  profilePhoto: {
    type: String, // URL to uploaded photo
    required: false
  },
  phone: {
    type: String,
    required: false,
    trim: true,
    maxlength: 15
  },
  
  // Status and approval tracking
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  
  // Admin approval information
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approvedAt: {
    type: Date,
    required: false
  },
  rejectionReason: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  
  // Additional fields for future use
  aadhaar: {
    type: String,
    required: false,
    trim: true,
    maxlength: 12
  },
  bankDetails: {
    accountNumber: {
      type: String,
      required: false,
      trim: true
    },
    ifscCode: {
      type: String,
      required: false,
      trim: true
    },
    bankName: {
      type: String,
      required: false,
      trim: true
    }
  },
  
  // Track if user account was created from this request
  userAccountCreated: {
    type: Boolean,
    default: false
  },
  createdUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityMembersSchema.index({ email: 1 });
communityMembersSchema.index({ status: 1, createdAt: -1 });
communityMembersSchema.index({ 'location.district': 1, 'location.state': 1 });
communityMembersSchema.index({ approvedBy: 1 });
communityMembersSchema.index({ userId: 1 });

// Virtual for full location
communityMembersSchema.virtual('fullLocation').get(function() {
  return `${this.location.district}, ${this.location.state}`;
});

// Virtual for display name
communityMembersSchema.virtual('displayName').get(function() {
  return this.name;
});

// Ensure virtual fields are serialized
communityMembersSchema.set('toJSON', { virtuals: true });
communityMembersSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityMembers', communityMembersSchema);




