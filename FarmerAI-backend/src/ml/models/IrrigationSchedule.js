// Irrigation Schedule Model
const mongoose = require('mongoose');

const IrrigationScheduleSchema = new mongoose.Schema({
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cropType: {
    type: String,
    required: true,
    trim: true
  },
  soilType: {
    type: String,
    required: true,
    trim: true
  },
  area: {
    type: Number,
    required: true,
    min: 0
  },
  schedule: [{
    date: {
      type: Date,
      required: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    duration: {
      type: Number,
      required: true,
      min: 0
    },
    reason: {
      type: String,
      required: true
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Scheduled', 'In Progress', 'Completed', 'Skipped', 'Cancelled'],
      default: 'Scheduled'
    },
    completedAt: {
      type: Date,
      required: false
    },
    notes: {
      type: String,
      maxlength: 500
    }
  }],
  waterUsage: {
    type: Number,
    required: true,
    min: 0
  },
  efficiency: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  recommendations: [{
    type: String,
    trim: true
  }],
  irrigationType: {
    type: String,
    enum: ['drip', 'sprinkler', 'flood', 'manual', 'automated'],
    default: 'drip'
  },
  waterSource: {
    type: String,
    enum: ['groundwater', 'surface_water', 'rainwater', 'treated_wastewater', 'other'],
    default: 'groundwater'
  },
  budget: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Active', 'Paused', 'Completed', 'Cancelled'],
    default: 'Active'
  },
  alerts: [{
    type: {
      type: String,
      enum: ['low_moisture', 'high_usage', 'schedule_reminder', 'equipment_failure'],
      required: true
    },
    threshold: {
      type: Number,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    lastTriggered: {
      type: Date,
      required: false
    }
  }],
  weatherData: {
    temperature: Number,
    humidity: Number,
    rainfall: Number,
    windSpeed: Number,
    lastUpdated: Date
  },
  sensorData: {
    soilMoisture: Number,
    temperature: Number,
    humidity: Number,
    lightIntensity: Number,
    lastUpdated: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
IrrigationScheduleSchema.index({ farmId: 1, userId: 1, createdAt: -1 });
IrrigationScheduleSchema.index({ status: 1 });
IrrigationScheduleSchema.index({ 'schedule.date': 1 });
IrrigationScheduleSchema.index({ cropType: 1 });

// Virtual for total water usage
IrrigationScheduleSchema.virtual('totalWaterUsage').get(function() {
  return this.schedule.reduce((total, session) => total + session.amount, 0);
});

// Virtual for completion rate
IrrigationScheduleSchema.virtual('completionRate').get(function() {
  const total = this.schedule.length;
  const completed = this.schedule.filter(s => s.status === 'Completed').length;
  return total > 0 ? (completed / total) * 100 : 0;
});

// Virtual for next irrigation
IrrigationScheduleSchema.virtual('nextIrrigation').get(function() {
  const now = new Date();
  const upcoming = this.schedule
    .filter(s => s.date > now && s.status === 'Scheduled')
    .sort((a, b) => a.date - b.date);
  return upcoming[0] || null;
});

// Method to add irrigation session
IrrigationScheduleSchema.methods.addIrrigationSession = function(sessionData) {
  this.schedule.push({
    date: sessionData.date,
    amount: sessionData.amount,
    duration: sessionData.duration,
    reason: sessionData.reason,
    priority: sessionData.priority || 'Medium',
    status: 'Scheduled',
    notes: sessionData.notes || ''
  });
  return this.save();
};

// Method to update session status
IrrigationScheduleSchema.methods.updateSessionStatus = function(sessionIndex, status, notes = '') {
  if (this.schedule[sessionIndex]) {
    this.schedule[sessionIndex].status = status;
    this.schedule[sessionIndex].notes = notes;
    if (status === 'Completed') {
      this.schedule[sessionIndex].completedAt = new Date();
    }
    return this.save();
  }
  throw new Error('Session not found');
};

// Method to calculate water efficiency
IrrigationScheduleSchema.methods.calculateEfficiency = function() {
  const totalScheduled = this.schedule.reduce((sum, s) => sum + s.amount, 0);
  const totalUsed = this.schedule
    .filter(s => s.status === 'Completed')
    .reduce((sum, s) => sum + s.amount, 0);
  
  this.efficiency = totalScheduled > 0 ? (totalUsed / totalScheduled) * 100 : 0;
  return this.save();
};

// Method to get upcoming sessions
IrrigationScheduleSchema.methods.getUpcomingSessions = function(days = 7) {
  const now = new Date();
  const futureDate = new Date();
  futureDate.setDate(now.getDate() + days);
  
  return this.schedule.filter(s => 
    s.date >= now && 
    s.date <= futureDate && 
    s.status === 'Scheduled'
  );
};

// Static method to get active schedules
IrrigationScheduleSchema.statics.getActiveSchedules = function(userId) {
  return this.find({ userId, status: 'Active' })
    .populate('farmId', 'name location')
    .sort({ createdAt: -1 });
};

// Static method to get schedules by date range
IrrigationScheduleSchema.statics.getSchedulesByDateRange = function(userId, startDate, endDate) {
  return this.find({
    userId,
    'schedule.date': {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ 'schedule.date': 1 });
};

// Pre-save middleware to validate data
IrrigationScheduleSchema.pre('save', function(next) {
  // Ensure efficiency is between 0 and 100
  if (this.efficiency < 0) this.efficiency = 0;
  if (this.efficiency > 100) this.efficiency = 100;
  
  // Sort schedule by date
  this.schedule.sort((a, b) => a.date - b.date);
  
  next();
});

module.exports = mongoose.model('IrrigationSchedule', IrrigationScheduleSchema);

