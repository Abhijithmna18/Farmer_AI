// src/models/SystemConfig.js
const mongoose = require('mongoose');

const SystemConfigSchema = new mongoose.Schema(
  {
    // General configuration
    general: {
      systemName: { type: String, default: 'FarmerAI' },
      logo: { type: String, default: '' },
      primaryColor: { type: String, default: '#10B981' },
      secondaryColor: { type: String, default: '#059669' },
      currency: { type: String, default: 'INR' },
      measurementUnit: { type: String, default: 'metric' }
    },

    // Warehouse and booking policies
    warehouse: {
      defaultDuration: { type: Number, default: 30 }, // in days
      cancellationPolicy: { type: String, default: '24h' },
      autoApproval: { type: Boolean, default: false }
    },

    // Payment and transaction settings
    payment: {
      gateway: { type: String, default: 'razorpay' },
      mode: { type: String, default: 'test' },
      apiKey: { type: String, default: '' },
      autoRefund: { type: Boolean, default: false }
    },

    // Communication settings
    communication: {
      emailSender: { type: String, default: 'noreply@farmerai.com' },
      smtpHost: { type: String, default: 'smtp.gmail.com' },
      smtpPort: { type: Number, default: 587 },
      smsGateway: { type: String, default: '' },
      whatsappGateway: { type: String, default: '' }
    },

    // Configuration metadata
    lastUpdatedBy: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String }
    },
    lastUpdatedAt: { type: Date, default: Date.now }
  },
  { 
    timestamps: true,
    collection: 'system_config'
  }
);

// Ensure only one configuration document exists
SystemConfigSchema.statics.getConfig = async function() {
  let config = await this.findOne();
  if (!config) {
    config = new this();
    await config.save();
  }
  return config;
};

// Update configuration with audit logging
SystemConfigSchema.statics.updateConfig = async function(updates, userId, userEmail) {
  let config = await this.findOne();
  if (!config) {
    config = new this();
  }
  
  // Apply updates
  Object.keys(updates).forEach(key => {
    if (typeof updates[key] === 'object' && updates[key] !== null) {
      config[key] = { ...config[key], ...updates[key] };
    } else {
      config[key] = updates[key];
    }
  });
  
  // Update metadata
  config.lastUpdatedBy = { userId, userEmail };
  config.lastUpdatedAt = new Date();
  
  return await config.save();
};

module.exports = mongoose.model('SystemConfig', SystemConfigSchema);