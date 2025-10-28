const mongoose = require('mongoose');

const fertilizerRecommendationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  farmId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farm',
    required: true
  },
  cropType: {
    type: String,
    required: true,
    trim: true
  },
  soilAnalysis: {
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
    ph: { type: Number, required: true },
    organicMatter: { type: Number, required: true },
    soilType: { type: String, required: true }
  },
  recommendations: [{
    fertilizerType: {
      type: String,
      required: true,
      enum: ['NPK', 'Urea', 'DAP', 'MOP', 'SSP', 'Organic', 'Custom']
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    unit: {
      type: String,
      required: true,
      enum: ['kg', 'bags', 'liters', 'tons']
    },
    applicationMethod: {
      type: String,
      required: true,
      enum: ['broadcast', 'band_placement', 'foliar', 'drip', 'fertigation']
    },
    timing: {
      type: String,
      required: true,
      enum: ['pre_planting', 'at_planting', 'side_dressing', 'top_dressing', 'post_harvest']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    reason: {
      type: String,
      required: true
    },
    expectedBenefit: {
      type: String,
      required: true
    }
  }],
  decisionTreePath: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'INR'
  },
  applicationSchedule: [{
    date: { type: Date, required: true },
    fertilizer: { type: String, required: true },
    amount: { type: Number, required: true },
    method: { type: String, required: true },
    notes: { type: String }
  }],
  soilTestDate: {
    type: Date,
    required: true
  },
  recommendationDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  feedback: {
    applied: { type: Boolean, default: false },
    actualAmount: { type: Number },
    actualDate: { type: Date },
    effectiveness: {
      type: String,
      enum: ['poor', 'fair', 'good', 'excellent']
    },
    notes: { type: String }
  }
}, {
  timestamps: true
});

// Index for efficient queries
fertilizerRecommendationSchema.index({ userId: 1, farmId: 1, recommendationDate: -1 });
fertilizerRecommendationSchema.index({ cropType: 1, recommendationDate: -1 });
fertilizerRecommendationSchema.index({ status: 1, recommendationDate: -1 });

// Virtual for total fertilizer amount
fertilizerRecommendationSchema.virtual('totalFertilizerAmount').get(function() {
  return this.recommendations.reduce((total, rec) => total + rec.amount, 0);
});

// Method to get recommendation summary
fertilizerRecommendationSchema.methods.getSummary = function() {
  const highPriority = this.recommendations.filter(r => r.priority === 'high' || r.priority === 'critical');
  const totalCost = this.totalCost;
  const fertilizerTypes = [...new Set(this.recommendations.map(r => r.fertilizerType))];
  
  return {
    totalRecommendations: this.recommendations.length,
    highPriorityCount: highPriority.length,
    totalCost,
    fertilizerTypes,
    applicationPeriod: this.applicationSchedule.length > 0 ? 
      Math.ceil((this.applicationSchedule[this.applicationSchedule.length - 1].date - this.applicationSchedule[0].date) / (1000 * 60 * 60 * 24)) : 0
  };
};

// Static method to get fertilizer trends
fertilizerRecommendationSchema.statics.getFertilizerTrends = async function(farmId, period = 90) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const recommendations = await this.find({
    farmId,
    recommendationDate: { $gte: startDate }
  }).sort({ recommendationDate: 1 });
  
  if (recommendations.length === 0) return null;
  
  const fertilizerUsage = {};
  const costTrend = [];
  
  recommendations.forEach(rec => {
    rec.recommendations.forEach(fertilizer => {
      if (!fertilizerUsage[fertilizer.fertilizerType]) {
        fertilizerUsage[fertilizer.fertilizerType] = 0;
      }
      fertilizerUsage[fertilizer.fertilizerType] += fertilizer.amount;
    });
    costTrend.push({
      date: rec.recommendationDate,
      cost: rec.totalCost
    });
  });
  
  return {
    fertilizerUsage,
    costTrend,
    totalRecommendations: recommendations.length,
    averageCost: costTrend.reduce((sum, item) => sum + item.cost, 0) / costTrend.length
  };
};

module.exports = mongoose.model('FertilizerRecommendation', fertilizerRecommendationSchema);
