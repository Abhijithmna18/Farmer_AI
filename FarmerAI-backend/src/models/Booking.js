// src/models/Booking.js
const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    warehouse: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true
    },
    warehouseOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    produce: {
      type: { type: String, required: true },
      quantity: { type: Number, required: true },
      unit: { type: String, enum: ['kg', 'tons', 'quintals', 'bags'], required: true },
      quality: { type: String, enum: ['premium', 'good', 'average', 'fair'], default: 'good' },
      description: { type: String },
      expectedHarvestDate: { type: Date },
      specialRequirements: { type: String }
    },
    storageRequirements: {
      temperature: { min: Number, max: Number },
      humidity: { min: Number, max: Number },
      storageType: { type: String, required: true },
      specialHandling: { type: String }
    },
    bookingDates: {
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      duration: { type: Number, required: true } // in days
    },
    pricing: {
      basePrice: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      currency: { type: String, default: 'INR' },
      platformFee: { type: Number, default: 0 },
      ownerAmount: { type: Number, required: true },
      seasonalMultiplier: { type: Number, default: 1.0 }
    },
    payment: {
      status: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially-refunded'],
        default: 'pending',
        index: true
      },
      razorpayOrderId: { type: String },
      razorpayPaymentId: { type: String },
      razorpaySignature: { type: String },
      paidAt: { type: Date },
      refundedAt: { type: Date },
      refundAmount: { type: Number, default: 0 },
      refundReason: { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'awaiting-approval', 'approved', 'rejected', 'cancelled', 'completed'],
      default: 'pending',
      index: true
    },
    approval: {
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      approvedAt: { type: Date },
      rejectedAt: { type: Date },
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rejectionReason: { type: String },
      notes: { type: String }
    },
    aiRecommendations: {
      idealStorageConditions: { type: mongoose.Schema.Types.Mixed },
      riskAssessment: { type: String },
      suggestedDuration: { type: Number },
      weatherAlerts: [{ type: String }],
      marketInsights: { type: String }
    },
    communication: [{
      sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isRead: { type: Boolean, default: false }
    }],
    documents: [{
      type: { type: String, enum: ['invoice', 'receipt', 'agreement', 'other'] },
      url: { type: String, required: true },
      name: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    reviews: {
      farmerRating: { type: Number, min: 1, max: 5 },
      farmerReview: { type: String },
      ownerRating: { type: Number, min: 1, max: 5 },
      ownerReview: { type: String },
      reviewedAt: { type: Date }
    },
    cancellation: {
      cancelledAt: { type: Date },
      cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reason: { type: String },
      refundEligible: { type: Boolean, default: true },
      refundAmount: { type: Number, default: 0 }
    },
    completion: {
      completedAt: { type: Date },
      actualEndDate: { type: Date },
      condition: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
      notes: { type: String }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
BookingSchema.index({ farmer: 1, status: 1 });
BookingSchema.index({ warehouseOwner: 1, status: 1 });
BookingSchema.index({ warehouse: 1, status: 1 });
BookingSchema.index({ 'bookingDates.startDate': 1, 'bookingDates.endDate': 1 });
BookingSchema.index({ 'payment.status': 1 });
BookingSchema.index({ 'approval.status': 1 });

// Virtual for checking if booking is active
BookingSchema.virtual('isActive').get(function() {
  return ['paid', 'awaiting-approval', 'approved'].includes(this.status);
});

// Virtual for checking if booking can be cancelled
BookingSchema.virtual('canBeCancelled').get(function() {
  const now = new Date();
  const startDate = new Date(this.bookingDates.startDate);
  const hoursUntilStart = (startDate - now) / (1000 * 60 * 60);
  
  return this.status === 'paid' && hoursUntilStart > 24; // Can cancel up to 24 hours before start
});

// Virtual for checking if booking is completed
BookingSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed' || 
         (this.status === 'approved' && new Date() > new Date(this.bookingDates.endDate));
});

// Instance method to generate booking ID
BookingSchema.statics.generateBookingId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BK${timestamp}${random}`.toUpperCase();
};

// Instance method to calculate refund amount
BookingSchema.methods.calculateRefund = function() {
  if (!this.cancellation || !this.cancellation.refundEligible) {
    return 0;
  }
  
  const now = new Date();
  const startDate = new Date(this.bookingDates.startDate);
  const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
  
  let refundPercentage = 1.0; // 100% refund
  
  if (daysUntilStart <= 0) {
    refundPercentage = 0; // No refund if already started
  } else if (daysUntilStart <= 7) {
    refundPercentage = 0.5; // 50% refund if less than 7 days
  } else if (daysUntilStart <= 30) {
    refundPercentage = 0.8; // 80% refund if less than 30 days
  }
  
  const refundAmount = this.pricing.totalAmount * refundPercentage;
  return Math.round(refundAmount);
};

// Instance method to update status
BookingSchema.methods.updateStatus = function(newStatus, updatedBy, notes = '') {
  const statusHistory = this.statusHistory || [];
  statusHistory.push({
    from: this.status,
    to: newStatus,
    updatedBy,
    updatedAt: new Date(),
    notes
  });
  
  this.status = newStatus;
  this.statusHistory = statusHistory;
  
  return this.save();
};

// Instance method to add communication
BookingSchema.methods.addCommunication = function(senderId, message) {
  this.communication.push({
    sender: senderId,
    message,
    timestamp: new Date()
  });
  
  return this.save();
};

// Static method to get booking statistics
BookingSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.farmer) matchStage.farmer = filters.farmer;
  if (filters.warehouseOwner) matchStage.warehouseOwner = filters.warehouseOwner;
  if (filters.status) matchStage.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    matchStage['bookingDates.startDate'] = {};
    if (filters.dateFrom) matchStage['bookingDates.startDate'].$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage['bookingDates.startDate'].$lte = new Date(filters.dateTo);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalBookings: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' },
        averageBookingValue: { $avg: '$pricing.totalAmount' },
        pendingBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        paidBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] }
        },
        approvedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
        },
        completedBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        cancelledBookings: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalBookings: 0,
    totalRevenue: 0,
    averageBookingValue: 0,
    pendingBookings: 0,
    paidBookings: 0,
    approvedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0
  };
};

module.exports = mongoose.model('Booking', BookingSchema);

