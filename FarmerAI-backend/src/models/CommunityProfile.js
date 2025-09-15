const mongoose = require('mongoose');

const communityProfileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  bio: {
    type: String,
    required: false,
    trim: true,
    maxlength: 500
  },
  profilePicture: {
    type: String, // URL to profile picture
    required: false
  },
  location: {
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    pincode: {
      type: String,
      required: false,
      trim: true
    }
  },
  farmingDetails: {
    crops: [{
      type: String,
      trim: true
    }],
    yearsOfExperience: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    farmSize: {
      type: Number, // in acres
      required: false
    },
    farmingType: {
      type: String,
      enum: ['organic', 'conventional', 'mixed', 'other'],
      required: false
    },
    specializations: [{
      type: String,
      trim: true
    }]
  },
  contactInfo: {
    phone: {
      type: String,
      required: false,
      trim: true
    },
    whatsapp: {
      type: String,
      required: false,
      trim: true
    },
    socialMedia: {
      facebook: {
        type: String,
        required: false
      },
      instagram: {
        type: String,
        required: false
      },
      youtube: {
        type: String,
        required: false
      }
    }
  },
  achievements: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      required: false,
      trim: true
    },
    year: {
      type: Number,
      required: false
    },
    organization: {
      type: String,
      required: false,
      trim: true
    }
  }],
  certifications: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    issuingOrganization: {
      type: String,
      required: true,
      trim: true
    },
    issueDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: false
    },
    certificateUrl: {
      type: String,
      required: false
    }
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
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
    trim: true
  },
  suspendedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  suspendedAt: {
    type: Date,
    required: false
  },
  suspensionReason: {
    type: String,
    required: false,
    trim: true
  },
  suspensionEndDate: {
    type: Date,
    required: false
  },
  stats: {
    postsCount: {
      type: Number,
      default: 0
    },
    commentsCount: {
      type: Number,
      default: 0
    },
    eventsSuggested: {
      type: Number,
      default: 0
    },
    reputation: {
      type: Number,
      default: 0
    },
    lastActive: {
      type: Date,
      default: Date.now
    }
  },
  preferences: {
    showContactInfo: {
      type: Boolean,
      default: true
    },
    showFarmingDetails: {
      type: Boolean,
      default: true
    },
    showAchievements: {
      type: Boolean,
      default: true
    },
    allowDirectMessages: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityProfileSchema.index({ status: 1, createdAt: -1 });
communityProfileSchema.index({ 'location.district': 1, status: 1 });
communityProfileSchema.index({ 'location.state': 1, status: 1 });
communityProfileSchema.index({ 'farmingDetails.crops': 1, status: 1 });
communityProfileSchema.index({ 'farmingDetails.yearsOfExperience': 1, status: 1 });
communityProfileSchema.index({ 'stats.reputation': -1, status: 1 });

// Ensure virtual fields are serialized
communityProfileSchema.set('toJSON', { virtuals: true });
communityProfileSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityProfile', communityProfileSchema);
