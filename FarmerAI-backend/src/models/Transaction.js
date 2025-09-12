const mongoose = require('mongoose');

// Transaction schema for payment tracking
const transactionSchema = new mongoose.Schema(
  {
    // Transaction identification
    transactionId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    orderNumber: {
      type: String,
      required: true,
      index: true
    },
    
    // User references
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Payment details
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR']
    },
    
    // Payment method and gateway
    paymentMethod: {
      type: String,
      required: true,
      enum: ['razorpay', 'stripe', 'upi', 'cod', 'wallet', 'bank_transfer']
    },
    paymentGateway: {
      type: String,
      enum: ['razorpay', 'stripe', 'payu', 'paytm', 'phonepe', 'gpay']
    },
    
    // Transaction status
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },
    
    // Gateway response data
    gatewayResponse: {
      paymentId: { type: String },
      orderId: { type: String },
      signature: { type: String },
      rawResponse: { type: mongoose.Schema.Types.Mixed },
      gatewayTransactionId: { type: String },
      gatewayOrderId: { type: String }
    },
    
    // Transaction timeline
    initiatedAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    },
    failedAt: {
      type: Date
    },
    refundedAt: {
      type: Date
    },
    
    // Failure and error information
    failureReason: {
      type: String
    },
    errorCode: {
      type: String
    },
    errorMessage: {
      type: String
    },
    
    // Refund information
    refund: {
      amount: { type: Number, min: 0 },
      reason: { type: String },
      status: { 
        type: String, 
        enum: ['requested', 'approved', 'rejected', 'processed', 'failed'] 
      },
      requestedAt: { type: Date },
      processedAt: { type: Date },
      refundId: { type: String },
      gatewayRefundId: { type: String }
    },
    
    // Fee and commission structure
    fees: {
      gatewayFee: { type: Number, default: 0 },
      platformFee: { type: Number, default: 0 },
      farmerCommission: { type: Number, default: 0 },
      netAmount: { type: Number, required: true }
    },
    
    // Additional metadata
    metadata: {
      deviceInfo: { type: String },
      ipAddress: { type: String },
      userAgent: { type: String },
      source: { type: String, default: 'web' }, // web, mobile, api
      version: { type: String }
    },
    
    // Security and verification
    securityChecks: {
      isVerified: { type: Boolean, default: false },
      riskScore: { type: Number, min: 0, max: 100 },
      fraudCheck: { type: Boolean, default: false },
      kycVerified: { type: Boolean, default: false }
    },
    
    // Settlement information
    settlement: {
      status: { 
        type: String, 
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      scheduledDate: { type: Date },
      processedDate: { type: Date },
      settlementId: { type: String },
      bankDetails: {
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String }
      }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
transactionSchema.index({ buyer: 1, createdAt: -1 });
transactionSchema.index({ farmer: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ paymentMethod: 1 });
transactionSchema.index({ initiatedAt: 1 });

// Virtual for transaction duration
transactionSchema.virtual('duration').get(function() {
  if (this.completedAt) {
    return this.completedAt - this.initiatedAt;
  }
  return Date.now() - this.initiatedAt;
});

// Virtual for checking if transaction is successful
transactionSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed';
});

// Virtual for checking if transaction can be refunded
transactionSchema.virtual('canBeRefunded').get(function() {
  return this.status === 'completed' && !this.refund;
});

// Pre-save middleware to generate transaction ID
transactionSchema.pre('save', async function(next) {
  if (this.isNew && !this.transactionId) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of transactions for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const count = await this.constructor.countDocuments({
      initiatedAt: { $gte: todayStart, $lt: todayEnd }
    });
    
    const transactionSequence = (count + 1).toString().padStart(6, '0');
    this.transactionId = `TXN${year}${month}${day}${transactionSequence}`;
  }
  
  // Calculate net amount
  if (this.amount && this.fees) {
    this.fees.netAmount = this.amount - (this.fees.gatewayFee || 0) - (this.fees.platformFee || 0);
  }
  
  next();
});

// Static method to find transactions by date range
transactionSchema.statics.findByDateRange = function(startDate, endDate, userId = null, userType = 'buyer') {
  const query = {
    initiatedAt: { $gte: startDate, $lte: endDate }
  };
  
  if (userId) {
    const field = userType === 'buyer' ? 'buyer' : 'farmer';
    query[field] = userId;
  }
  
  return this.find(query).sort({ initiatedAt: -1 });
};

// Static method to get transaction statistics
transactionSchema.statics.getTransactionStats = async function(userId, userType = 'buyer', period = 'month') {
  const matchField = userType === 'buyer' ? 'buyer' : 'farmer';
  
  // Calculate date range based on period
  const now = new Date();
  let startDate;
  
  switch (period) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  
  const stats = await this.aggregate([
    { 
      $match: { 
        [matchField]: mongoose.Types.ObjectId(userId),
        initiatedAt: { $gte: startDate }
      } 
    },
    {
      $group: {
        _id: null,
        totalTransactions: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
        successfulTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        pendingTransactions: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        totalFees: { $sum: '$fees.gatewayFee' },
        netAmount: { $sum: '$fees.netAmount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalTransactions: 0,
    totalAmount: 0,
    successfulTransactions: 0,
    failedTransactions: 0,
    pendingTransactions: 0,
    totalFees: 0,
    netAmount: 0
  };
};

// Instance method to update transaction status
transactionSchema.methods.updateStatus = function(newStatus, additionalData = {}) {
  this.status = newStatus;
  
  // Set appropriate timestamp
  switch (newStatus) {
    case 'completed':
      this.completedAt = new Date();
      break;
    case 'failed':
      this.failedAt = new Date();
      this.failureReason = additionalData.reason;
      this.errorCode = additionalData.errorCode;
      this.errorMessage = additionalData.errorMessage;
      break;
    case 'refunded':
    case 'partially_refunded':
      this.refundedAt = new Date();
      break;
  }
  
  // Update gateway response if provided
  if (additionalData.gatewayResponse) {
    this.gatewayResponse = { ...this.gatewayResponse, ...additionalData.gatewayResponse };
  }
  
  return this.save();
};

// Instance method to process refund
transactionSchema.methods.processRefund = function(refundAmount, reason, refundId = null) {
  if (this.status !== 'completed') {
    throw new Error('Can only refund completed transactions');
  }
  
  if (refundAmount > this.amount) {
    throw new Error('Refund amount cannot exceed transaction amount');
  }
  
  this.refund = {
    amount: refundAmount,
    reason,
    status: 'requested',
    requestedAt: new Date(),
    refundId
  };
  
  if (refundAmount === this.amount) {
    this.status = 'refunded';
  } else {
    this.status = 'partially_refunded';
  }
  
  this.refundedAt = new Date();
  
  return this.save();
};

// Instance method to complete refund
transactionSchema.methods.completeRefund = function(gatewayRefundId) {
  if (!this.refund || this.refund.status !== 'requested') {
    throw new Error('No pending refund to complete');
  }
  
  this.refund.status = 'processed';
  this.refund.processedAt = new Date();
  this.refund.gatewayRefundId = gatewayRefundId;
  
  return this.save();
};

// Instance method to calculate fees
transactionSchema.methods.calculateFees = function() {
  const platformFeeRate = 0.02; // 2% platform fee
  const gatewayFeeRate = 0.018; // 1.8% gateway fee
  
  this.fees.platformFee = Math.round(this.amount * platformFeeRate * 100) / 100;
  this.fees.gatewayFee = Math.round(this.amount * gatewayFeeRate * 100) / 100;
  this.fees.netAmount = this.amount - this.fees.platformFee - this.fees.gatewayFee;
  
  return this.fees;
};

module.exports = mongoose.model('Transaction', transactionSchema);
