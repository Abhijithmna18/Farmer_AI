// src/models/User.js
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    name: { type: String },
    email: { type: String, unique: true, index: true, required: true },
    phone: { type: String },
    password: { type: String }, // hashed
    googleId: { type: String },
    verified: { type: Boolean, default: false },
    emailVerified: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    roles: { type: [String], default: ['farmer'] },
    role: { type: String, enum: ['farmer', 'warehouse-owner', 'admin'], default: 'farmer', index: true },
    userType: { 
      type: String, 
      enum: ['farmer', 'buyer', 'warehouse-owner', 'both'], 
      default: 'farmer',
      index: true 
    },

    // Extended profile fields
    location: { type: String },
    state: { type: String },
    district: { type: String },
    pincode: { type: String },
    soilType: { type: String },
    crops: { type: [String], default: [] },
    language: { type: String },
    photoURL: { type: String },

    // Farmer-specific fields
    farmerProfile: {
      farmName: { type: String },
      farmSize: { type: Number }, // in acres
      farmLocation: {
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number }
        },
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String }
      },
      farmingExperience: { type: Number }, // in years
      certifications: [{
        type: String,
        enum: ['organic', 'pesticide-free', 'non-gmo', 'fair-trade', 'local', 'other']
      }],
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
      },
      verificationDocuments: [{
        type: { type: String },
        url: { type: String },
        uploadedAt: { type: Date, default: Date.now }
      }],
      bankDetails: {
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        accountHolderName: { type: String }
      },
      rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
      },
      totalSales: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 }
    },

    // Buyer-specific fields
    buyerProfile: {
      addresses: [{
        name: { type: String, required: true },
        phone: { type: String, required: true },
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true },
        landmark: { type: String },
        isDefault: { type: Boolean, default: false },
        type: { type: String, enum: ['home', 'office', 'other'], default: 'home' }
      }],
      paymentMethods: [{
        type: { type: String, enum: ['card', 'upi', 'wallet', 'netbanking'] },
        details: { type: mongoose.Schema.Types.Mixed },
        isDefault: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true }
      }],
      preferences: {
        preferredCategories: [{ type: String }],
        maxDeliveryDistance: { type: Number, default: 50 }, // in km
        organicPreference: { type: Boolean, default: false },
        localPreference: { type: Boolean, default: true }
      },
      rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
      },
      totalPurchases: { type: Number, default: 0 },
      totalOrders: { type: Number, default: 0 }
    },

    // Warehouse Owner-specific fields
    warehouseOwnerProfile: {
      businessName: { type: String },
      businessType: { type: String, enum: ['individual', 'partnership', 'company', 'cooperative'] },
      registrationNumber: { type: String },
      gstNumber: { type: String },
      panNumber: { type: String },
      businessAddress: {
        address: { type: String },
        city: { type: String },
        state: { type: String },
        pincode: { type: String },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number }
        }
      },
      bankDetails: {
        accountNumber: { type: String },
        ifscCode: { type: String },
        bankName: { type: String },
        accountHolderName: { type: String },
        upiId: { type: String }
      },
      documents: [{
        type: { type: String, enum: ['license', 'permit', 'gst', 'pan', 'bank', 'insurance', 'other'] },
        url: { type: String, required: true },
        name: { type: String, required: true },
        expiryDate: { type: Date },
        uploadedAt: { type: Date, default: Date.now }
      }],
      verificationStatus: {
        type: String,
        enum: ['unverified', 'pending', 'verified', 'rejected'],
        default: 'unverified'
      },
      rating: {
        average: { type: Number, default: 0, min: 0, max: 5 },
        count: { type: Number, default: 0 }
      },
      totalBookings: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
      isActive: { type: Boolean, default: true }
    },

    // User preferences
    preferences: {
      language: { type: String, default: 'en' },
      theme: { type: String, default: 'light' },
      timezone: { type: String, default: 'UTC' },
      temperatureUnit: { type: String, default: 'celsius' },
      measurementUnit: { type: String, default: 'metric' }
    },

    // Notification preferences
    notificationPreferences: {
      email: {
        weather: { type: Boolean, default: true },
        soil: { type: Boolean, default: true },
        growth: { type: Boolean, default: true },
        reports: { type: Boolean, default: false },
        orders: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        marketplace: { type: Boolean, default: true }
      },
      sms: {
        weather: { type: Boolean, default: false },
        soil: { type: Boolean, default: false },
        growth: { type: Boolean, default: true },
        reports: { type: Boolean, default: false },
        orders: { type: Boolean, default: true },
        payments: { type: Boolean, default: false }
      },
      push: {
        orders: { type: Boolean, default: true },
        payments: { type: Boolean, default: true },
        marketplace: { type: Boolean, default: true },
        chat: { type: Boolean, default: true }
      }
    },

    // Login history
    loginHistory: [{
      device: { type: String },
      location: { type: String },
      ip: { type: String },
      timestamp: { type: Date, default: Date.now }
    }]
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for better query performance
UserSchema.index({ userType: 1 });
UserSchema.index({ 'farmerProfile.verificationStatus': 1 });
UserSchema.index({ 'farmerProfile.farmLocation.coordinates': '2dsphere' });

// Virtual for checking if user is a farmer
UserSchema.virtual('isFarmer').get(function() {
  return this.userType === 'farmer' || this.userType === 'both';
});

// Virtual for checking if user is a buyer
UserSchema.virtual('isBuyer').get(function() {
  return this.userType === 'buyer' || this.userType === 'both';
});

// Virtual for checking if user is a warehouse owner
UserSchema.virtual('isWarehouseOwner').get(function() {
  return this.userType === 'warehouse-owner' || this.userType === 'both' || this.role === 'warehouse-owner';
});

// Virtual for checking if farmer is verified
UserSchema.virtual('isFarmerVerified').get(function() {
  return this.farmerProfile && this.farmerProfile.verificationStatus === 'verified';
});

// Instance method to update farmer rating
UserSchema.methods.updateFarmerRating = function(newRating) {
  if (!this.farmerProfile) {
    this.farmerProfile = {};
  }
  
  const currentTotal = this.farmerProfile.rating.average * this.farmerProfile.rating.count;
  const newCount = this.farmerProfile.rating.count + 1;
  const newAverage = (currentTotal + newRating) / newCount;
  
  this.farmerProfile.rating.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
  this.farmerProfile.rating.count = newCount;
  
  return this.save();
};

// Instance method to update buyer rating
UserSchema.methods.updateBuyerRating = function(newRating) {
  if (!this.buyerProfile) {
    this.buyerProfile = {};
  }
  
  const currentTotal = this.buyerProfile.rating.average * this.buyerProfile.rating.count;
  const newCount = this.buyerProfile.rating.count + 1;
  const newAverage = (currentTotal + newRating) / newCount;
  
  this.buyerProfile.rating.average = Math.round(newAverage * 10) / 10; // Round to 1 decimal
  this.buyerProfile.rating.count = newCount;
  
  return this.save();
};

// Instance method to update warehouse owner rating
UserSchema.methods.updateWarehouseOwnerRating = function(newRating) {
  if (!this.warehouseOwnerProfile) {
    this.warehouseOwnerProfile = {};
  }
  
  const currentTotal = this.warehouseOwnerProfile.rating.average * this.warehouseOwnerProfile.rating.count;
  const newCount = this.warehouseOwnerProfile.rating.count + 1;
  const newAverage = (currentTotal + newRating) / newCount;
  
  this.warehouseOwnerProfile.rating.average = Math.round(newAverage * 10) / 10;
  this.warehouseOwnerProfile.rating.count = newCount;
  
  return this.save();
};

// Instance method to add buyer address
UserSchema.methods.addBuyerAddress = function(addressData) {
  if (!this.buyerProfile) {
    this.buyerProfile = { addresses: [] };
  }
  
  if (!this.buyerProfile.addresses) {
    this.buyerProfile.addresses = [];
  }
  
  // If this is the first address or marked as default, make it default
  if (this.buyerProfile.addresses.length === 0 || addressData.isDefault) {
    this.buyerProfile.addresses.forEach(addr => addr.isDefault = false);
    addressData.isDefault = true;
  }
  
  this.buyerProfile.addresses.push(addressData);
  return this.save();
};

// Instance method to set default address
UserSchema.methods.setDefaultAddress = function(addressId) {
  if (!this.buyerProfile || !this.buyerProfile.addresses) {
    throw new Error('No addresses found');
  }
  
  this.buyerProfile.addresses.forEach(addr => {
    addr.isDefault = addr._id.toString() === addressId.toString();
  });
  
  return this.save();
};

// Static method to find farmers by location
UserSchema.statics.findFarmersNearby = function(coordinates, maxDistance = 50) {
  return this.find({
    userType: { $in: ['farmer', 'both'] },
    'farmerProfile.farmLocation.coordinates': {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [coordinates.longitude, coordinates.latitude]
        },
        $maxDistance: maxDistance * 1000 // Convert km to meters
      }
    },
    'farmerProfile.verificationStatus': 'verified'
  });
};

// Static method to get user statistics
UserSchema.statics.getUserStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        farmers: {
          $sum: { $cond: [{ $in: ['$userType', ['farmer', 'both']] }, 1, 0] }
        },
        buyers: {
          $sum: { $cond: [{ $in: ['$userType', ['buyer', 'both']] }, 1, 0] }
        },
        verifiedFarmers: {
          $sum: { 
            $cond: [
              { $and: [
                { $in: ['$userType', ['farmer', 'both']] },
                { $eq: ['$farmerProfile.verificationStatus', 'verified'] }
              ]}, 
              1, 
              0
            ] 
          }
        },
        pendingVerifications: {
          $sum: { 
            $cond: [
              { $and: [
                { $in: ['$userType', ['farmer', 'both']] },
                { $eq: ['$farmerProfile.verificationStatus', 'pending'] }
              ]}, 
              1, 
              0
            ] 
          }
        }
      }
    }
  ]);
  
  return stats[0] || {
    totalUsers: 0,
    farmers: 0,
    buyers: 0,
    verifiedFarmers: 0,
    pendingVerifications: 0
  };
};

module.exports = mongoose.model('User', UserSchema);
