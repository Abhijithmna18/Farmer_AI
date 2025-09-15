const mongoose = require('mongoose');

const communityCommentSchema = new mongoose.Schema({
  post: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityPost',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CommunityComment',
    required: false // null for top-level comments
  },
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
  isSolution: {
    type: Boolean,
    default: false // Marked as solution by post author
  },
  markedAsSolutionBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  markedAsSolutionAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityCommentSchema.index({ post: 1, status: 1, createdAt: 1 });
communityCommentSchema.index({ author: 1, status: 1 });
communityCommentSchema.index({ parentComment: 1, status: 1 });
communityCommentSchema.index({ isSolution: 1, status: 1 });

// Virtual for vote count
communityCommentSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for reply count
communityCommentSchema.virtual('replyCount', {
  ref: 'CommunityComment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true
});

// Ensure virtual fields are serialized
communityCommentSchema.set('toJSON', { virtuals: true });
communityCommentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityComment', communityCommentSchema);
