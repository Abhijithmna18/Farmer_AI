const mongoose = require('mongoose');

const BookingStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  COMPLETED: 'completed'
};

const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded'
};

const WarehouseBookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  warehouse: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Warehouse',
    required: true
  },
  bookingPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    durationInDays: {
      type: Number,
      required: true
    }
  },
  storageDetails: {
    storageType: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    unit: {
      type: String,
      enum: ['kg', 'ton', 'sqft', 'unit'],
      required: true
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  payment: {
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
    status: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING
    },
    paymentMethod: String,
    paymentDate: Date
  },
  status: {
    type: String,
    enum: Object.values(BookingStatus),
    default: BookingStatus.PENDING
  },
  adminNotes: String,
  cancellationReason: String,
  cancellationRequestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationDate: Date,
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster querying
WarehouseBookingSchema.index({ user: 1, status: 1 });
WarehouseBookingSchema.index({ warehouse: 1, status: 1 });
WarehouseBookingSchema.index({ 'bookingPeriod.startDate': 1, 'bookingPeriod.endDate': 1 });
WarehouseBookingSchema.index({ 'payment.status': 1, status: 1 });

// Virtual for invoice number
WarehouseBookingSchema.virtual('invoiceNumber').get(function() {
  return `INV-${this._id.toString().slice(-8).toUpperCase()}`;
});

// Method to check if booking is active
WarehouseBookingSchema.methods.isActiveBooking = function() {
  const now = new Date();
  return (
    this.status === BookingStatus.CONFIRMED &&
    this.bookingPeriod.startDate <= now &&
    this.bookingPeriod.endDate >= now
  );
};

// Static method to get booking statistics
WarehouseBookingSchema.statics.getBookingStats = async function(warehouseId) {
  const stats = await this.aggregate([
    {
      $match: {
        warehouse: mongoose.Types.ObjectId(warehouseId),
        status: { $in: [BookingStatus.CONFIRMED, BookingStatus.PENDING] }
      }
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalRevenue: { $sum: '$pricing.totalAmount' }
      }
    }
  ]);

  return stats.reduce((acc, curr) => ({
    ...acc,
    [curr._id]: {
      count: curr.count,
      totalRevenue: curr.totalRevenue
    }
  }), {});
};

module.exports = {
  WarehouseBooking: mongoose.model('WarehouseBooking', WarehouseBookingSchema),
  BookingStatus,
  PaymentStatus
};
