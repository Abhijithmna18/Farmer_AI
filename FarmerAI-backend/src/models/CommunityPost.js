const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 5000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Crop-Specific Questions',
      'Pest & Disease Control',
      'Irrigation Techniques',
      'Soil Health',
      'FarmerAI Support',
      'Government Schemes & Subsidies'
    ]
  },
  images: [{
    type: String, // URLs to uploaded images
    required: false
  }],
  videos: [{
    type: String, // URLs to uploaded videos
    required: false
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'edited'],
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
  editedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  editedAt: {
    type: Date,
    required: false
  },
  editReason: {
    type: String,
    required: false,
    trim: true
  },
  upvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  downvotes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  views: {
    type: Number,
    default: 0
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isLocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityPostSchema.index({ status: 1, createdAt: -1 });
communityPostSchema.index({ category: 1, status: 1 });
communityPostSchema.index({ author: 1, status: 1 });
communityPostSchema.index({ tags: 1, status: 1 });

// Virtual for vote count
communityPostSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for comment count
communityPostSchema.virtual('commentCount', {
  ref: 'CommunityComment',
  localField: '_id',
  foreignField: 'post',
  count: true
});

// Ensure virtual fields are serialized
communityPostSchema.set('toJSON', { virtuals: true });
communityPostSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityPost', communityPostSchema);