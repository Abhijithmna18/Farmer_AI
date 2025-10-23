// src/models/WorkshopSubscription.js
const mongoose = require('mongoose');

const WorkshopSubscriptionSchema = new mongoose.Schema(
  {
    subscriptionId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['monthly', 'yearly', 'workshop'],
      default: 'monthly'
    },
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    amount: {
      total: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    razorpay: {
      orderId: { type: String, index: true },
      paymentId: { type: String, index: true },
      signature: { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'expired', 'cancelled'],
      default: 'pending',
      index: true
    },
    workshops: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workshop'
    }],
    metadata: {
      userAgent: { type: String },
      ipAddress: { type: String },
      device: { type: String }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
WorkshopSubscriptionSchema.index({ user: 1, status: 1 });
WorkshopSubscriptionSchema.index({ 'razorpay.orderId': 1 });
WorkshopSubscriptionSchema.index({ 'razorpay.paymentId': 1 });
WorkshopSubscriptionSchema.index({ endDate: 1 });

// Virtual for checking if subscription is active
WorkshopSubscriptionSchema.virtual('isActive').get(function() {
  return this.status === 'active' && new Date() <= new Date(this.endDate);
});

// Virtual for checking days remaining
WorkshopSubscriptionSchema.virtual('daysRemaining').get(function() {
  if (!this.endDate) return 0;
  const today = new Date();
  const end = new Date(this.endDate);
  const diffTime = end - today;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
});

// Instance method to generate subscription ID
WorkshopSubscriptionSchema.statics.generateSubscriptionId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `SUB${timestamp}${random}`.toUpperCase();
};

// Instance method to update status
WorkshopSubscriptionSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  return this.save();
};

module.exports = mongoose.model('WorkshopSubscription', WorkshopSubscriptionSchema);