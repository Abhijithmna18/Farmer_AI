const mongoose = require('mongoose');

const communityReportSchema = new mongoose.Schema({
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportedContent: {
    type: {
      type: String,
      enum: ['post', 'comment', 'event', 'profile'],
      required: true
    },
    contentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    }
  },
  reason: {
    type: String,
    required: true,
    enum: [
      'spam',
      'inappropriate-content',
      'misinformation',
      'harassment',
      'fake-information',
      'off-topic',
      'duplicate',
      'other'
    ]
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  reviewedAt: {
    type: Date,
    required: false
  },
  action: {
    type: String,
    enum: [
      'no-action',
      'content-removed',
      'content-edited',
      'user-warned',
      'user-suspended',
      'user-banned'
    ],
    required: false
  },
  adminNotes: {
    type: String,
    required: false,
    trim: true,
    maxlength: 1000
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityReportSchema.index({ status: 1, createdAt: -1 });
communityReportSchema.index({ reporter: 1, status: 1 });
communityReportSchema.index({ 'reportedContent.type': 1, 'reportedContent.contentId': 1 });
communityReportSchema.index({ priority: 1, status: 1 });
communityReportSchema.index({ reviewedBy: 1, status: 1 });

module.exports = mongoose.model('CommunityReport', communityReportSchema);
