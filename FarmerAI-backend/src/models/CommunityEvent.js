const mongoose = require('mongoose');

const communityEventSchema = new mongoose.Schema({
  title: {
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
  eventType: {
    type: String,
    required: true,
    enum: ['workshop', 'festival', 'seminar', 'field-visit', 'training', 'other']
  },
  suggestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  organizer: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    contact: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: false,
      trim: true
    }
  },
  location: {
    address: {
      type: String,
      required: true,
      trim: true
    },
    district: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        required: false
      },
      longitude: {
        type: Number,
        required: false
      }
    }
  },
  schedule: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    startTime: {
      type: String,
      required: true
    },
    endTime: {
      type: String,
      required: true
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPattern: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: false
    }
  },
  capacity: {
    maxAttendees: {
      type: Number,
      required: false
    },
    currentAttendees: {
      type: Number,
      default: 0
    }
  },
  cost: {
    isFree: {
      type: Boolean,
      default: true
    },
    amount: {
      type: Number,
      required: false
    },
    currency: {
      type: String,
      default: 'INR'
    }
  },
  images: [{
    type: String, // URLs to uploaded images
    required: false
  }],
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled', 'completed'],
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
  attendees: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    registeredAt: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    }
  }],
  requirements: {
    type: String,
    required: false,
    trim: true
  },
  benefits: {
    type: String,
    required: false,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for better performance
communityEventSchema.index({ status: 1, 'schedule.startDate': 1 });
communityEventSchema.index({ 'location.district': 1, status: 1 });
communityEventSchema.index({ eventType: 1, status: 1 });
communityEventSchema.index({ suggestedBy: 1, status: 1 });
communityEventSchema.index({ tags: 1, status: 1 });

// Virtual for registration count
communityEventSchema.virtual('registrationCount').get(function() {
  return this.attendees.filter(attendee => attendee.status === 'registered').length;
});

// Ensure virtual fields are serialized
communityEventSchema.set('toJSON', { virtuals: true });
communityEventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('CommunityEvent', communityEventSchema);
