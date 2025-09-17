// src/models/Warehouse.js
const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    location: {
      address: {
        type: String,
        required: true
      },
      city: {
        type: String,
        required: true
      },
      state: {
        type: String,
        required: true
      },
      pincode: {
        type: String,
        required: true
      },
      coordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point'
        },
        coordinates: {
          type: [Number], // [longitude, latitude]
          required: true
        }
      }
    },
    capacity: {
      total: {
        type: Number,
        required: true,
        min: 0
      },
      available: {
        type: Number,
        required: true,
        min: 0
      },
      unit: {
        type: String,
        enum: ['kg', 'tons', 'quintals', 'bags', 'sqft', 'cubic_meters'],
        default: 'kg'
      }
    },
    storageTypes: [{
      type: String,
      enum: ['cold_storage', 'dry_storage', 'grain_storage', 'refrigerated', 'frozen', 'ambient', 'controlled_atmosphere'],
      required: true
    }],
    facilities: [{
      type: String,
      enum: ['security', 'cctv', 'fire_safety', 'loading_dock', 'forklift', 'temperature_control', 'humidity_control', 'pest_control', 'insurance']
    }],
    pricing: {
      basePrice: {
        type: Number,
        required: true,
        min: 0
      },
      pricePerUnit: {
        type: String,
        enum: ['per_kg', 'per_ton', 'per_quintal', 'per_bag', 'per_sqft', 'per_cubic_meter', 'per_day', 'per_month'],
        default: 'per_kg'
      },
      currency: {
        type: String,
        default: 'INR'
      },
      seasonalMultiplier: {
        type: Number,
        default: 1.0,
        min: 0.1,
        max: 5.0
      }
    },
    images: [{
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String
      },
      isPrimary: {
        type: Boolean,
        default: false
      }
    }],
    operatingHours: {
      start: {
        type: String,
        default: '06:00'
      },
      end: {
        type: String,
        default: '18:00'
      },
      workingDays: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        default: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    },
    contact: {
      phone: {
        type: String,
        required: true
      },
      email: {
        type: String,
        required: true
      },
      alternatePhone: {
        type: String
      }
    },
    verification: {
      status: {
        type: String,
        enum: ['pending', 'verified', 'rejected'],
        default: 'pending'
      },
      verifiedAt: {
        type: Date
      },
      verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      documents: [{
        type: {
          type: String,
          enum: ['license', 'permit', 'gst', 'pan', 'insurance', 'other']
        },
        url: String,
        name: String,
        expiryDate: Date
      }]
    },
    rating: {
      average: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
      },
      count: {
        type: Number,
        default: 0
      }
    },
    bookings: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking'
    }],
    status: {
      type: String,
      enum: ['draft', 'active', 'inactive', 'maintenance', 'suspended'],
      default: 'draft',
      index: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    specialInstructions: {
      type: String,
      maxlength: 500
    },
    terms: {
      minimumBookingDuration: {
        type: Number,
        default: 1 // in days
      },
      maximumBookingDuration: {
        type: Number,
        default: 365 // in days
      },
      advanceBookingDays: {
        type: Number,
        default: 30 // in days
      },
      cancellationPolicy: {
        type: String,
        enum: ['flexible', 'moderate', 'strict'],
        default: 'moderate'
      }
    }
  },
  {
    timestamps: true
  }
);

// Create geospatial index for location-based queries
WarehouseSchema.index({ 'location.coordinates': '2dsphere' });

// Create compound indexes for common queries
WarehouseSchema.index({ status: 1, 'verification.status': 1 });
WarehouseSchema.index({ owner: 1, status: 1 });
WarehouseSchema.index({ 'location.city': 1, status: 1 });
WarehouseSchema.index({ storageTypes: 1, status: 1 });
WarehouseSchema.index({ 'pricing.basePrice': 1, status: 1 });

// Virtual for checking if warehouse is verified
WarehouseSchema.virtual('isVerified').get(function() {
  return this.verification.status === 'verified';
});

// Virtual for checking if warehouse is available for booking
WarehouseSchema.virtual('isAvailableForBooking').get(function() {
  return this.status === 'active' && 
         this.verification.status === 'verified' && 
         this.isAvailable;
});

// Method to calculate distance from a point
WarehouseSchema.methods.calculateDistance = function(latitude, longitude) {
  if (!this.location.coordinates || !this.location.coordinates.coordinates) {
    return null;
  }
  
  const [lng, lat] = this.location.coordinates.coordinates;
  const R = 6371; // Earth's radius in kilometers
  const dLat = (latitude - lat) * Math.PI / 180;
  const dLng = (longitude - lng) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat * Math.PI / 180) * Math.cos(latitude * Math.PI / 180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Pre-save middleware to ensure only one primary image
WarehouseSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const primaryImages = this.images.filter(img => img.isPrimary);
    if (primaryImages.length > 1) {
      // Keep only the first primary image
      this.images.forEach((img, index) => {
        if (index > 0) img.isPrimary = false;
      });
    }
  }
  next();
});

module.exports = mongoose.model('Warehouse', WarehouseSchema);









