const mongoose = require('mongoose');

// Order item schema for individual products in an order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  productSnapshot: {
    // Store product details at time of order to prevent issues if product is modified
    name: { type: String, required: true },
    price: { type: Number, required: true },
    unit: { type: String, required: true },
    image: { type: String },
    farmerName: { type: String, required: true }
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  }
}, { timestamps: true });

// Shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  pincode: { type: String, required: true },
  landmark: { type: String },
  instructions: { type: String }
});

// Order schema
const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
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
    
    // Order items
    items: [orderItemSchema],
    
    // Pricing breakdown
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryFee: {
      type: Number,
      default: 0,
      min: 0
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    
    // Order status
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
      index: true
    },
    
    // Payment information
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
      default: 'pending',
      index: true
    },
    paymentMethod: {
      type: String,
      enum: ['razorpay', 'stripe', 'upi', 'cod', 'wallet'],
      required: true
    },
    paymentId: {
      type: String,
      index: true
    },
    paymentDetails: {
      transactionId: { type: String },
      gatewayResponse: { type: mongoose.Schema.Types.Mixed },
      paidAt: { type: Date }
    },
    
    // Delivery information
    shippingAddress: {
      type: shippingAddressSchema,
      required: true
    },
    deliveryMethod: {
      type: String,
      enum: ['pickup', 'home_delivery', 'shipping'],
      required: true
    },
    deliveryDate: {
      type: Date
    },
    deliveryTimeSlot: {
      start: { type: String },
      end: { type: String }
    },
    trackingNumber: {
      type: String
    },
    deliveryNotes: {
      type: String
    },
    
    // Order timeline
    orderDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    confirmedAt: {
      type: Date
    },
    shippedAt: {
      type: Date
    },
    deliveredAt: {
      type: Date
    },
    cancelledAt: {
      type: Date
    },
    cancellationReason: {
      type: String
    },
    
    // Communication
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      message: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      isSystemMessage: { type: Boolean, default: false }
    }],
    
    // Reviews and ratings
    review: {
      rating: { type: Number, min: 1, max: 5 },
      comment: { type: String },
      reviewedAt: { type: Date }
    },
    
    // Special instructions
    specialInstructions: {
      type: String
    },
    
    // Refund information
    refund: {
      amount: { type: Number, min: 0 },
      reason: { type: String },
      status: { type: String, enum: ['requested', 'approved', 'rejected', 'processed'] },
      requestedAt: { type: Date },
      processedAt: { type: Date }
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
orderSchema.index({ buyer: 1, orderDate: -1 });
orderSchema.index({ farmer: 1, orderDate: -1 });
orderSchema.index({ status: 1, orderDate: -1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderNumber: 1 });

// Virtual for order age in days
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.orderDate) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if order can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ['pending', 'confirmed'].includes(this.status);
});

// Virtual for checking if order can be reviewed
orderSchema.virtual('canBeReviewed').get(function() {
  return this.status === 'delivered' && !this.review;
});

// Pre-save middleware to generate order number
orderSchema.pre('save', async function(next) {
  if (this.isNew && !this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    // Get count of orders for today
    const todayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
    
    const count = await this.constructor.countDocuments({
      orderDate: { $gte: todayStart, $lt: todayEnd }
    });
    
    const orderSequence = (count + 1).toString().padStart(4, '0');
    this.orderNumber = `ORD${year}${month}${day}${orderSequence}`;
  }
  next();
});

// Static method to find orders by date range
orderSchema.statics.findByDateRange = function(startDate, endDate, userId = null) {
  const query = {
    orderDate: { $gte: startDate, $lte: endDate }
  };
  
  if (userId) {
    query.$or = [
      { buyer: userId },
      { farmer: userId }
    ];
  }
  
  return this.find(query).sort({ orderDate: -1 });
};

// Static method to get order statistics
orderSchema.statics.getOrderStats = async function(userId, userType = 'buyer') {
  const matchField = userType === 'buyer' ? 'buyer' : 'farmer';
  
  const stats = await this.aggregate([
    { $match: { [matchField]: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' },
        pendingOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        completedOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
        },
        cancelledOrders: {
          $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalOrders: 0,
    totalAmount: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0
  };
};

// Instance method to update order status
orderSchema.methods.updateStatus = function(newStatus, userId) {
  const statusHistory = this.statusHistory || [];
  statusHistory.push({
    status: newStatus,
    updatedBy: userId,
    updatedAt: new Date()
  });
  
  this.status = newStatus;
  this.statusHistory = statusHistory;
  
  // Set timestamp based on status
  switch (newStatus) {
    case 'confirmed':
      this.confirmedAt = new Date();
      break;
    case 'shipped':
      this.shippedAt = new Date();
      break;
    case 'delivered':
      this.deliveredAt = new Date();
      break;
    case 'cancelled':
      this.cancelledAt = new Date();
      break;
  }
  
  return this.save();
};

// Instance method to add message
orderSchema.methods.addMessage = function(senderId, message, isSystemMessage = false) {
  this.messages.push({
    sender: senderId,
    message,
    isSystemMessage,
    timestamp: new Date()
  });
  
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
