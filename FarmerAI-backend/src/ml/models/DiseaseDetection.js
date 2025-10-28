// Disease Detection Model
const mongoose = require('mongoose');

const DiseaseDetectionSchema = new mongoose.Schema({
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
  diseaseType: {
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
    enum: ['Detected', 'Treated', 'Resolved', 'Ongoing'],
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
  }
}, {
  timestamps: true
});

// Indexes for better query performance
DiseaseDetectionSchema.index({ userId: 1, createdAt: -1 });
DiseaseDetectionSchema.index({ diseaseType: 1 });
DiseaseDetectionSchema.index({ severity: 1 });
DiseaseDetectionSchema.index({ status: 1 });
DiseaseDetectionSchema.index({ location: '2dsphere' });

// Virtual for confidence percentage
DiseaseDetectionSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidence * 100);
});

// Virtual for days since detection
DiseaseDetectionSchema.virtual('daysSinceDetection').get(function() {
  const now = new Date();
  const diffTime = Math.abs(now - this.createdAt);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Method to update treatment status
DiseaseDetectionSchema.methods.updateTreatment = function(treatment, status = 'Treated') {
  this.treatmentApplied = treatment;
  this.status = status;
  this.treatmentDate = new Date();
  return this.save();
};

// Method to schedule follow-up
DiseaseDetectionSchema.methods.scheduleFollowUp = function(days = 7) {
  this.followUpDate = new Date();
  this.followUpDate.setDate(this.followUpDate.getDate() + days);
  return this.save();
};

// Static method to get disease statistics
DiseaseDetectionSchema.statics.getDiseaseStats = function(userId, period = 30) {
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
        _id: '$diseaseType',
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' },
        severityCounts: {
          $push: '$severity'
        }
      }
    },
    {
      $sort: { count: -1 }
    }
  ]);
};

// Static method to get recent detections
DiseaseDetectionSchema.statics.getRecentDetections = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('farmId', 'name location')
    .select('-__v');
};

// Pre-save middleware to validate data
DiseaseDetectionSchema.pre('save', function(next) {
  // Ensure confidence is between 0 and 1
  if (this.confidence < 0) this.confidence = 0;
  if (this.confidence > 1) this.confidence = 1;
  
  // Set severity based on confidence if not provided
  if (this.severity === 'Unknown' && this.confidence) {
    if (this.confidence >= 0.9) this.severity = 'High';
    else if (this.confidence >= 0.7) this.severity = 'Medium';
    else this.severity = 'Low';
  }
  
  next();
});

module.exports = mongoose.model('DiseaseDetection', DiseaseDetectionSchema);

