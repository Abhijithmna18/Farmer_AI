const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['Bug Report', 'Feature Suggestion', 'General Comment'],
    required: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  attachment: {
    type: String, // File path for uploaded attachment
    required: false
  },
  status: {
    type: String,
    enum: ['Received', 'In Progress', 'Completed'],
    default: 'Received'
  },
  adminNotes: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false
  },
  farmerComment: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false
  },
  adminComment: {
    type: String,
    trim: true,
    maxlength: 1000,
    required: false
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  resolvedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
feedbackSchema.index({ userId: 1, createdAt: -1 });
feedbackSchema.index({ status: 1, createdAt: -1 });
feedbackSchema.index({ type: 1, status: 1 });
feedbackSchema.index({ assignedTo: 1 });

// Ensure virtual fields are serialized
feedbackSchema.set('toJSON', { virtuals: true });
feedbackSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Feedback', feedbackSchema);



