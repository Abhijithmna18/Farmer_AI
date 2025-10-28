// Health Score Model
const mongoose = require('mongoose');

const HealthScoreSchema = new mongoose.Schema({
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
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  riskLevel: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    required: true
  },
  anomalies: [{
    type: {
      type: String,
      required: true,
      enum: ['temperature', 'humidity', 'soil_moisture', 'light_intensity', 'nutrient_deficiency', 'disease_risk', 'pest_risk', 'water_stress']
    },
    severity: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    description: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      required: true
    },
    sensorData: {
      temperature: Number,
      humidity: Number,
      soilMoisture: Number,
      lightIntensity: Number
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.8
    }
  }],
  recommendations: [{
    type: {
      type: String,
      required: true,
      enum: ['immediate', 'short_term', 'long_term']
    },
    priority: {
      type: String,
      required: true,
      enum: ['Low', 'Medium', 'High', 'Critical']
    },
    description: {
      type: String,
      required: true
    },
    category: {
      type: String,
      required: true,
      enum: ['irrigation', 'fertilization', 'pest_control', 'disease_management', 'environmental', 'monitoring']
    }
  }],
  sensorData: {
    temperature: {
      type: Number,
      required: true
    },
    humidity: {
      type: Number,
      required: true
    },
    soilMoisture: {
      type: Number,
      required: true
    },
    lightIntensity: {
      type: Number,
      required: true
    },
    lastUpdated: {
      type: Date,
      required: true
    }
  },
  environmentalFactors: {
    weather: {
      temperature: Number,
      humidity: Number,
      rainfall: Number,
      windSpeed: Number
    },
    season: {
      type: String,
      enum: ['spring', 'summer', 'autumn', 'winter']
    },
    cropStage: {
      type: String,
      enum: ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest']
    }
  },
  trends: {
    scoreTrend: {
      type: String,
      enum: ['improving', 'stable', 'declining'],
      default: 'stable'
    },
    anomalyCount: {
      type: Number,
      default: 0
    },
    riskTrend: {
      type: String,
      enum: ['decreasing', 'stable', 'increasing'],
      default: 'stable'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
HealthScoreSchema.index({ farmId: 1, userId: 1, createdAt: -1 });
HealthScoreSchema.index({ score: 1 });
HealthScoreSchema.index({ riskLevel: 1 });
HealthScoreSchema.index({ 'anomalies.type': 1 });
HealthScoreSchema.index({ 'anomalies.severity': 1 });

// Virtual for score percentage
HealthScoreSchema.virtual('scorePercentage').get(function() {
  return Math.round(this.score * 100);
});

// Virtual for health status
HealthScoreSchema.virtual('healthStatus').get(function() {
  if (this.score >= 0.8) return 'Excellent';
  if (this.score >= 0.6) return 'Good';
  if (this.score >= 0.4) return 'Fair';
  if (this.score >= 0.2) return 'Poor';
  return 'Critical';
});

// Virtual for anomaly count
HealthScoreSchema.virtual('anomalyCount').get(function() {
  return this.anomalies.length;
});

// Method to add anomaly
HealthScoreSchema.methods.addAnomaly = function(anomalyData) {
  this.anomalies.push({
    type: anomalyData.type,
    severity: anomalyData.severity,
    description: anomalyData.description,
    timestamp: anomalyData.timestamp || new Date(),
    sensorData: anomalyData.sensorData || {},
    confidence: anomalyData.confidence || 0.8
  });
  
  // Update anomaly count in trends
  this.trends.anomalyCount = this.anomalies.length;
  
  return this.save();
};

// Method to add recommendation
HealthScoreSchema.methods.addRecommendation = function(recommendationData) {
  this.recommendations.push({
    type: recommendationData.type,
    priority: recommendationData.priority,
    description: recommendationData.description,
    category: recommendationData.category
  });
  return this.save();
};

// Method to update score and risk level
HealthScoreSchema.methods.updateScore = function(newScore, riskLevel) {
  this.score = newScore;
  this.riskLevel = riskLevel;
  
  // Update trends
  if (newScore > this.score) {
    this.trends.scoreTrend = 'improving';
  } else if (newScore < this.score) {
    this.trends.scoreTrend = 'declining';
  } else {
    this.trends.scoreTrend = 'stable';
  }
  
  return this.save();
};

// Method to get critical anomalies
HealthScoreSchema.methods.getCriticalAnomalies = function() {
  return this.anomalies.filter(anomaly => 
    anomaly.severity === 'Critical' || anomaly.severity === 'High'
  );
};

// Method to get recommendations by priority
HealthScoreSchema.methods.getRecommendationsByPriority = function(priority) {
  return this.recommendations.filter(rec => rec.priority === priority);
};

// Static method to get health statistics
HealthScoreSchema.statics.getHealthStats = function(userId, period = 30) {
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
        _id: null,
        avgScore: { $avg: '$score' },
        minScore: { $min: '$score' },
        maxScore: { $max: '$score' },
        totalRecords: { $sum: 1 },
        riskLevels: { $push: '$riskLevel' },
        anomalyCounts: { $push: { $size: '$anomalies' } }
      }
    }
  ]);
};

// Static method to get health trends
HealthScoreSchema.statics.getHealthTrends = function(userId, farmId, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.find({
    userId,
    farmId,
    createdAt: { $gte: startDate }
  })
  .sort({ createdAt: 1 })
  .select('score riskLevel anomalies createdAt');
};

// Static method to get farms with low health scores
HealthScoreSchema.statics.getLowHealthFarms = function(userId, threshold = 0.4) {
  return this.find({
    userId,
    score: { $lt: threshold }
  })
  .sort({ score: 1 })
  .populate('farmId', 'name location')
  .select('farmId score riskLevel anomalies createdAt');
};

// Pre-save middleware to validate data
HealthScoreSchema.pre('save', function(next) {
  // Ensure score is between 0 and 1
  if (this.score < 0) this.score = 0;
  if (this.score > 1) this.score = 1;
  
  // Set risk level based on score if not provided
  if (!this.riskLevel) {
    if (this.score >= 0.8) this.riskLevel = 'Low';
    else if (this.score >= 0.6) this.riskLevel = 'Medium';
    else if (this.score >= 0.4) this.riskLevel = 'High';
    else this.riskLevel = 'Critical';
  }
  
  // Update anomaly count
  this.trends.anomalyCount = this.anomalies.length;
  
  next();
});

module.exports = mongoose.model('HealthScore', HealthScoreSchema);

