// src/models/ConfigLog.js
const mongoose = require('mongoose');

const ConfigLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      enum: [
        'UPDATE_PREFERENCES',
        'UPDATE_SYSTEM_CONFIG',
        'UPDATE_ENVIRONMENT_CONFIG',
        'RESTORE_DEFAULTS'
      ]
    },
    category: {
      type: String,
      required: true,
      enum: [
        'admin_preferences',
        'system_configuration',
        'environment_configuration',
        'security'
      ]
    },
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      email: { type: String, required: true }
    },
    changes: {
      type: mongoose.Schema.Types.Mixed, // Store the actual changes made
      required: true
    },
    ipAddress: { type: String },
    userAgent: { type: String }
  },
  { 
    timestamps: true,
    collection: 'config_logs'
  }
);

// Indexes for better query performance
ConfigLogSchema.index({ 'user.userId': 1 });
ConfigLogSchema.index({ category: 1 });
ConfigLogSchema.index({ action: 1 });
ConfigLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ConfigLog', ConfigLogSchema);