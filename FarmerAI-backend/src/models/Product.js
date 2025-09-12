const mongoose = require('mongoose');

// Product schema for marketplace listings
const productSchema = new mongoose.Schema(
  {
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Basic product information
    name: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    category: {
      type: String,
      required: true,
      enum: ['vegetables', 'fruits', 'grains', 'spices', 'herbs', 'flowers', 'seeds', 'other'],
      index: true
    },
    subcategory: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: true,
      maxlength: 1000
    },
    
    // Visual content
    images: [{
      url: { type: String, required: true },
      alt: { type: String },
      isPrimary: { type: Boolean, default: false }
    }],
    
    // Pricing and inventory
    price: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'g', 'dozen', 'piece', 'bunch', 'bag', 'box', 'liter', 'ml'],
      default: 'kg'
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: 1
    },
    maxOrderQuantity: {
      type: Number,
      min: 1
    },
    
    // Location and delivery
    location: {
      coordinates: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
      },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      deliveryRadius: { type: Number, default: 50 } // in km
    },
    
    // Harvest and quality information
    harvestDate: {
      type: Date,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    },
    quality: {
      type: String,
      enum: ['premium', 'good', 'standard'],
      default: 'good'
    },
    organic: {
      type: Boolean,
      default: false
    },
    certifications: [{
      type: String,
      enum: ['organic', 'pesticide-free', 'non-gmo', 'fair-trade', 'local']
    }],
    
    // Product status and visibility
    status: {
      type: String,
      enum: ['draft', 'active', 'sold_out', 'expired', 'suspended'],
      default: 'draft',
      index: true
    },
    isFeatured: {
      type: Boolean,
      default: false
    },
    
    // SEO and discovery
    tags: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    keywords: [{
      type: String,
      trim: true,
      lowercase: true
    }],
    
    // Analytics and performance
    views: {
      type: Number,
      default: 0
    },
    favorites: {
      type: Number,
      default: 0
    },
    orders: {
      type: Number,
      default: 0
    },
    
    // Connection to growth calendar
    growthCalendarId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GrowthCalendar'
    },
    harvestRecordId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'GrowthCalendar.harvestRecords'
    },
    
    // Availability and scheduling
    availableFrom: {
      type: Date,
      default: Date.now
    },
    availableUntil: {
      type: Date
    },
    
    // Delivery options
    deliveryOptions: {
      pickup: { type: Boolean, default: true },
      homeDelivery: { type: Boolean, default: false },
      shipping: { type: Boolean, default: false }
    },
    
    // Pricing tiers for bulk orders
    bulkPricing: [{
      minQuantity: { type: Number, required: true },
      maxQuantity: { type: Number },
      price: { type: Number, required: true },
      discount: { type: Number, default: 0 } // percentage
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
productSchema.index({ farmer: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ location: '2dsphere' }); // Geospatial index
productSchema.index({ harvestDate: 1 });
productSchema.index({ price: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ createdAt: -1 });

// Virtual for calculating days since harvest
productSchema.virtual('daysSinceHarvest').get(function() {
  return Math.floor((Date.now() - this.harvestDate) / (1000 * 60 * 60 * 24));
});

// Virtual for checking if product is fresh
productSchema.virtual('isFresh').get(function() {
  const daysSinceHarvest = this.daysSinceHarvest;
  return daysSinceHarvest <= 7; // Consider fresh if harvested within 7 days
});

// Virtual for calculating discount based on freshness
productSchema.virtual('freshnessDiscount').get(function() {
  const daysSinceHarvest = this.daysSinceHarvest;
  if (daysSinceHarvest <= 1) return 0;
  if (daysSinceHarvest <= 3) return 5;
  if (daysSinceHarvest <= 7) return 10;
  return 15;
});

// Pre-save middleware to set primary image
productSchema.pre('save', function(next) {
  if (this.images && this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  next();
});

// Static method to find products by location
productSchema.statics.findNearby = function(coordinates, maxDistance = 50) {
  return this.find({
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    status: 'active'
  });
};

// Instance method to check availability
productSchema.methods.isAvailable = function() {
  const now = new Date();
  return (
    this.status === 'active' &&
    this.stock > 0 &&
    this.availableFrom <= now &&
    (!this.availableUntil || this.availableUntil >= now) &&
    this.expiryDate > now
  );
};

// Instance method to calculate final price with bulk discounts
productSchema.methods.calculatePrice = function(quantity) {
  if (this.bulkPricing && this.bulkPricing.length > 0) {
    const applicablePricing = this.bulkPricing
      .filter(pricing => quantity >= pricing.minQuantity && (!pricing.maxQuantity || quantity <= pricing.maxQuantity))
      .sort((a, b) => b.minQuantity - a.minQuantity)[0];
    
    if (applicablePricing) {
      return applicablePricing.price;
    }
  }
  
  return this.price;
};

module.exports = mongoose.model('Product', productSchema);
