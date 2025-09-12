const mongoose = require('mongoose');

// Weather snapshot schema for storing weather data at event time
const weatherSnapshotSchema = new mongoose.Schema({
  temperature: { type: Number },
  humidity: { type: Number },
  precipitation: { type: Number },
  windSpeed: { type: Number },
  condition: { type: String }, // sunny, cloudy, rainy, etc.
  recordedAt: { type: Date, default: Date.now },
  source: { type: String, default: 'weather-api' }
});

// Crop event schema for logging farming activities
const cropEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['sowing', 'fertilization', 'irrigation', 'harvest', 'pest_control', 'pruning', 'weeding', 'custom'],
  },
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String }, // specific field/plot location
  notes: { type: String },
  weatherSnapshot: weatherSnapshotSchema,
  attachments: [{ type: String }], // URLs to uploaded images/documents
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // For recurring events
  isRecurring: { type: Boolean, default: false },
  recurrencePattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly', 'yearly'] },
    interval: { type: Number, default: 1 },
    endDate: { type: Date }
  }
}, { timestamps: true });

// Collaboration schema for sharing calendars
const collaborationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: {
    type: String,
    enum: ['viewer', 'editor', 'admin'],
    default: 'viewer',
  },
  invitedAt: { type: Date, default: Date.now },
  acceptedAt: { type: Date },
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

// Notification schema for reminders
const notificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['email', 'in_app', 'sms'],
    required: true,
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  scheduledFor: { type: Date, required: true },
  isSent: { type: Boolean, default: false },
  sentAt: { type: Date },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CropEvent',
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, { timestamps: true });

// Analytics schema for storing calculated statistics
const analyticsSchema = new mongoose.Schema({
  totalCropsSown: { type: Number, default: 0 },
  averageGrowthDuration: { type: Number }, // in days
  missedTasks: { type: Number, default: 0 },
  completedTasks: { type: Number, default: 0 },
  expectedYield: { type: Number },
  actualYield: { type: Number },
  season: { type: String }, // e.g., "2024-spring"
  calculatedAt: { type: Date, default: Date.now },
});

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  scheduledDate: { type: Date },
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  notes: { type: String },
});

const growthStageSchema = new mongoose.Schema({
  stageName: {
    type: String,
    required: true,
    enum: ['Seed', 'Sprout', 'Seedling', 'Vegetative', 'Budding', 'Flowering', 'Ripening', 'Harvest'],
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  careNeeds: { type: String },
  nutrientRequirements: { type: String },
  tasks: [taskSchema],
  expectedDuration: { type: Number }, // in days
  actualDuration: { type: Number }, // in days
});

const harvestRecordSchema = new mongoose.Schema({
  actualHarvestDate: { type: Date, required: true },
  yieldNotes: { type: String },
  observations: { type: String },
  quantity: { type: Number },
  unit: { type: String, default: 'kg' },
  quality: { type: String, enum: ['excellent', 'good', 'fair', 'poor'] },
  marketPrice: { type: Number },
  totalValue: { type: Number },
});

const growthCalendarSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    cropName: {
      type: String,
      required: true,
      trim: true,
    },
    variety: {
      type: String,
      trim: true,
    },
    plantingDate: {
      type: Date,
      required: true,
    },
    estimatedHarvestDate: {
      type: Date,
    },
    regionalClimate: {
      type: String,
    },
    successionNotes: {
      type: String,
    },
    cropRotationGuidelines: {
      type: String,
    },
    stages: [growthStageSchema],
    harvestRecords: [harvestRecordSchema],
    customReminders: [
      {
        title: { type: String, required: true },
        date: { type: Date, required: true },
        description: { type: String },
      },
    ],
    // New enhanced fields
    cropEvents: [cropEventSchema],
    collaborators: [collaborationSchema],
    notifications: [notificationSchema],
    analytics: analyticsSchema,
    // Offline sync support
    lastSyncedAt: { type: Date, default: Date.now },
    isOffline: { type: Boolean, default: false },
    pendingChanges: [{ type: String }], // Array of change IDs for offline sync
    // Export/Import support
    exportHistory: [{
      format: { type: String, enum: ['csv', 'pdf', 'json'] },
      exportedAt: { type: Date, default: Date.now },
      exportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      fileSize: { type: Number },
    }],
    // AI Enhancement fields
    aiSuggestions: [{
      type: { type: String, enum: ['sowing_window', 'harvest_window', 'weather_adjustment', 'pest_alert'] },
      suggestion: { type: String, required: true },
      confidence: { type: Number, min: 0, max: 1 },
      generatedAt: { type: Date, default: Date.now },
      isApplied: { type: Boolean, default: false },
    }],
    // Location and field information
    location: {
      name: { type: String },
      coordinates: {
        latitude: { type: Number },
        longitude: { type: Number },
      },
      area: { type: Number }, // in acres/hectares
      soilType: { type: String },
    },
    // Season and year tracking
    season: { type: String }, // e.g., "2024-spring", "2024-fall"
    year: { type: Number },
    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

const GrowthCalendar = mongoose.model('GrowthCalendar', growthCalendarSchema);

module.exports = GrowthCalendar;
