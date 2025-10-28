// Pest Detection Model
const mongoose = require('mongoose');

const PestDetectionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: false
  },
  imageUrl: {
    type: String,
    required: true
  },
  pestType: {
    type: String,
    required: true,
    trim: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  severity: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical', 'Unknown'],
    default: 'Unknown'
  },
  damageLevel: {
    type: String,
    enum: ['Minimal', 'Light', 'Moderate', 'Severe', 'Critical', 'Unknown'],
    default: 'Unknown'
  },
  affectedArea: {
    type: String,
    enum: ['Leaves', 'Stem', 'Roots', 'Fruits', 'Flowers', 'Multiple', 'Unknown'],
    default: 'Unknown'
  },
  treatment: {
    type: String,
    required: true
  },
  prevention: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: false
    }
  },
  notes: {
    type: String,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Detected', 'Treated', 'Resolved', 'Ongoing', 'Escalated'],
    default: 'Detected'
  },
  treatmentApplied: {
    type: String,
    required: false
  },
  treatmentDate: {
    type: Date,
    required: false
  },
  followUpDate: {
    type: Date,
    required: false
  },
  economicImpact: {
    type: Number,
    min: 0,
    required: false
  },
  lifecycleStage: {
    type: String,
    enum: ['Egg', 'Larva', 'Pupa', 'Adult', 'Unknown'],
    default: 'Unknown'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
PestDetectionSchema.index({ userId: 1, createdAt: -1 });
PestDetectionSchema.index({ farmId: 1, createdAt: -1 });
PestDetectionSchema.index({ pestType: 1 });
PestDetectionSchema.index({ severity: 1 });
PestDetectionSchema.index({ status: 1 });
PestDetectionSchema.index({ location: '2dsphere' });

// Virtual for confidence percentage
PestDetectionSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidence * 100);
});

// Virtual for days since detection
PestDetectionSchema.virtual('daysSinceDetection').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update treatment status
PestDetectionSchema.methods.updateTreatment = function(treatment, status = 'Treated') {
  this.treatmentApplied = treatment;
  this.status = status;
  this.treatmentDate = new Date();
  return this.save();
};

// Method to schedule follow-up
PestDetectionSchema.methods.scheduleFollowUp = function(days = 7) {
  this.followUpDate = new Date();
  this.followUpDate.setDate(this.followUpDate.getDate() + days);
  return this.save();
};

// Method to calculate economic impact
PestDetectionSchema.methods.calculateEconomicImpact = function(cropValue, affectedArea) {
  const impactFactors = {
    'Minimal': 0.05,
    'Light': 0.15,
    'Moderate': 0.30,
    'Severe': 0.60,
    'Critical': 0.90
  };
  
  const factor = impactFactors[this.damageLevel] || 0.05;
  this.economicImpact = cropValue * affectedArea * factor;
  return this.save();
};

// Static method to get pest statistics
PestDetectionSchema.statics.getPestStats = function(userId, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: '$pestType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        severityCounts: {
          $push: '$severity'
        },
        damageLevels: {
          $push: '$damageLevel'
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get recent detections
PestDetectionSchema.statics.getRecentDetections = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('farmId', 'name location')
    .select('-__v');
};

// Static method to get pest hotspots
PestDetectionSchema.statics.getPestHotspots = function(userId, farmId = null) {
  const matchQuery = { userId };
  if (farmId) matchQuery.farmId = farmId;
  
  return this.aggregate([
    {
      $match: matchQuery
    },
    {
      $group: {
        _id: {
          pestType: '$pestType',
          location: '$location.coordinates'
        },
        count: { $sum: 1 },
        avgSeverity: { $avg: '$severity' }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Pre-save middleware to validate data
PestDetectionSchema.pre('save', function(next) {
  // Ensure confidence is between 0 and 1
  if (this.confidence < 0) this.confidence = 0;
  if (this.confidence > 1) this.confidence = 1;
  
  // Set severity based on confidence if not provided
  if (this.severity === 'Unknown' && this.confidence) {
    if (this.confidence >= 0.9) this.severity = 'High';
    else if (this.confidence >= 0.7) this.severity = 'Medium';
    else this.severity = 'Low';
  }
  
  // Set damage level based on severity if not provided
  if (this.damageLevel === 'Unknown' && this.severity !== 'Unknown') {
    const damageMapping = {
      'Low': 'Minimal',
      'Medium': 'Light',
      'High': 'Moderate',
      'Critical': 'Severe'
    };
    this.damageLevel = damageMapping[this.severity] || 'Minimal';
  }
  
  next();
});

module.exports = mongoose.model('PestDetection', PestDetectionSchema);

