const mongoose = require('mongoose');

const communityJoinRequestSchema = new mongoose.Schema({
  fullName: {
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
  },
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
  bio: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
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
  // Track if user was created from this request
  userCreated: {
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
communityJoinRequestSchema.index({ email: 1 });
communityJoinRequestSchema.index({ status: 1, createdAt: -1 });
communityJoinRequestSchema.index({ district: 1, state: 1 });
communityJoinRequestSchema.index({ approvedBy: 1 });

// Ensure virtual fields are serialized
communityJoinRequestSchema.set('toJSON', { virtuals: true });
communityJoinRequestSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityJoinRequest', communityJoinRequestSchema);




