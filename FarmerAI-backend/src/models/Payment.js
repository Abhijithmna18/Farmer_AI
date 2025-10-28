// src/models/Payment.js
const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      unique: true,
      required: true,
      index: true
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    warehouseOwner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    amount: {
      total: { type: Number, required: true },
      baseAmount: { type: Number, required: true },
      platformFee: { type: Number, required: true },
      ownerAmount: { type: Number, required: true },
      currency: { type: String, default: 'INR' }
    },
    razorpay: {
      orderId: { type: String, required: true },
      paymentId: { type: String },
      signature: { type: String },
      status: {
        type: String,
        enum: ['created', 'attempted', 'paid', 'failed', 'cancelled'],
        default: 'created'
      },
      method: { type: String },
      bank: { type: String },
      wallet: { type: String },
      vpa: { type: String },
      cardId: { type: String },
      international: { type: Boolean, default: false },
      amountPaid: { type: Number },
      amountRefunded: { type: Number, default: 0 },
      refundStatus: { type: String, enum: ['none', 'partial', 'full'] },
      captured: { type: Boolean, default: false },
      description: { type: String },
      notes: [{ type: String }],
      fee: { type: Number },
      tax: { type: Number },
      errorCode: { type: String },
      errorDescription: { type: String }
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    refund: {
      razorpayRefundId: { type: String },
      amount: { type: Number, default: 0 },
      status: {
        type: String,
        enum: ['none', 'pending', 'processed', 'failed']
      },
      reason: { type: String },
      notes: { type: String },
      processedAt: { type: Date }
    },
    payout: {
      status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
      },
      razorpayPayoutId: { type: String },
      amount: { type: Number },
      processedAt: { type: Date },
      failureReason: { type: String }
    },
    webhook: {
      received: { type: Boolean, default: false },
      processed: { type: Boolean, default: false },
      receivedAt: { type: Date },
      processedAt: { type: Date },
      signature: { type: String },
      payload: { type: mongoose.Schema.Types.Mixed }
    },
    metadata: {
      userAgent: { type: String },
      ipAddress: { type: String },
      device: { type: String },
      browser: { type: String },
      os: { type: String }
    },
    timeline: [{
      status: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      description: { type: String },
      data: { type: mongoose.Schema.Types.Mixed }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
PaymentSchema.index({ farmer: 1, status: 1 });
PaymentSchema.index({ warehouseOwner: 1, status: 1 });
PaymentSchema.index({ 'razorpay.orderId': 1 });
PaymentSchema.index({ 'razorpay.paymentId': 1 });
PaymentSchema.index({ createdAt: -1 });

// Virtual for checking if payment is successful
PaymentSchema.virtual('isSuccessful').get(function() {
  return this.status === 'completed' && this.razorpay.status === 'paid';
});

// Virtual for checking if payment is refundable
PaymentSchema.virtual('isRefundable').get(function() {
  return this.isSuccessful && this.refund.status === 'none' && this.refund.amount === 0;
});

// Instance method to generate payment ID
PaymentSchema.statics.generatePaymentId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `PAY${timestamp}${random}`.toUpperCase();
};

// Instance method to update status
PaymentSchema.methods.updateStatus = function(newStatus, description = '', data = {}) {
  this.timeline.push({
    status: newStatus,
    description,
    data
  });
  
  this.status = newStatus;
  return this.save();
};

// Instance method to process refund
PaymentSchema.methods.processRefund = async function(amount, reason, notes = '') {
  if (!this.isRefundable) {
    throw new Error('Payment is not refundable');
  }
  
  const refundAmount = amount || this.amount.total;
  
  this.refund = {
    amount: refundAmount,
    status: 'pending',
    reason,
    notes
  };
  
  this.status = 'refunded';
  this.amount.amountRefunded = refundAmount;
  
  await this.updateStatus('refunded', `Refund initiated for amount ${refundAmount}`, {
    refundAmount,
    reason,
    notes
  });
  
  return this.save();
};

// Instance method to process payout
PaymentSchema.methods.processPayout = async function(razorpayPayoutId) {
  this.payout = {
    status: 'processing',
    razorpayPayoutId,
    amount: this.amount.ownerAmount
  };
  
  await this.updateStatus('processing', 'Payout initiated to warehouse owner', {
    payoutId: razorpayPayoutId,
    amount: this.amount.ownerAmount
  });
  
  return this.save();
};

// Instance method to complete payout
PaymentSchema.methods.completePayout = async function() {
  this.payout.status = 'completed';
  this.payout.processedAt = new Date();
  
  await this.updateStatus('completed', 'Payout completed successfully', {
    payoutId: this.payout.razorpayPayoutId,
    amount: this.payout.amount
  });
  
  return this.save();
};

// Static method to get payment statistics
PaymentSchema.statics.getStats = async function(filters = {}) {
  const matchStage = {};
  
  if (filters.farmer) matchStage.farmer = filters.farmer;
  if (filters.warehouseOwner) matchStage.warehouseOwner = filters.warehouseOwner;
  if (filters.status) matchStage.status = filters.status;
  if (filters.dateFrom || filters.dateTo) {
    matchStage.createdAt = {};
    if (filters.dateFrom) matchStage.createdAt.$gte = new Date(filters.dateFrom);
    if (filters.dateTo) matchStage.createdAt.$lte = new Date(filters.dateTo);
  }
  
  const stats = await this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalPayments: { $sum: 1 },
        totalAmount: { $sum: '$amount.total' },
        totalPlatformFee: { $sum: '$amount.platformFee' },
        totalOwnerAmount: { $sum: '$amount.ownerAmount' },
        totalRefunded: { $sum: '$amount.amountRefunded' },
        successfulPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
        },
        failedPayments: {
          $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
        },
        refundedPayments: {
          $sum: { $cond: [{ $gt: ['$amount.amountRefunded', 0] }, 1, 0] }
        },
        averagePaymentValue: { $avg: '$amount.total' }
      }
    }
  ]);
  
  return stats[0] || {
    totalPayments: 0,
    totalAmount: 0,
    totalPlatformFee: 0,
    totalOwnerAmount: 0,
    totalRefunded: 0,
    successfulPayments: 0,
    failedPayments: 0,
    refundedPayments: 0,
    averagePaymentValue: 0
  };
};

module.exports = mongoose.model('Payment', PaymentSchema);

