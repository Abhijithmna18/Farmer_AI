const mongoose = require('mongoose');

const yieldPredictionSchema = new mongoose.Schema({
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
  predictedYield: {
    type: Number,
    required: true,
    min: 0
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  inputFeatures: {
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    ph: { type: Number, required: true },
    rainfall: { type: Number, required: true },
    soilType: { type: String, required: true },
    irrigationMethod: { type: String, required: true },
    plantingDate: { type: Date, required: true },
    expectedHarvestDate: { type: Date, required: true }
  },
  modelVersion: {
    type: String,
    default: '1.0.0'
  },
  predictionDate: {
    type: Date,
    default: Date.now
  },
  actualYield: {
    type: Number,
    default: null
  },
  accuracy: {
    type: Number,
    default: null
  },
  recommendations: [{
    type: {
      type: String,
      enum: ['fertilizer', 'irrigation', 'pest_control', 'harvest_timing'],
      required: true
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      required: true
    },
    message: {
      type: String,
      required: true
    },
    expectedImpact: {
      type: String,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Index for efficient queries
yieldPredictionSchema.index({ userId: 1, farmId: 1, predictionDate: -1 });
yieldPredictionSchema.index({ cropType: 1, predictionDate: -1 });
yieldPredictionSchema.index({ status: 1, predictionDate: -1 });

// Virtual for yield per hectare
yieldPredictionSchema.virtual('yieldPerHectare').get(function() {
  // Assuming farm area is stored in farm document
  // This would need to be populated from farm data
  return this.predictedYield; // Placeholder - would need farm area
});

// Method to calculate accuracy when actual yield is provided
yieldPredictionSchema.methods.calculateAccuracy = function(actualYield) {
  if (actualYield && actualYield > 0) {
    const error = Math.abs(this.predictedYield - actualYield);
    this.accuracy = Math.max(0, 100 - (error / actualYield) * 100);
    this.actualYield = actualYield;
    return this.accuracy;
  }
  return null;
};

// Method to get yield trend
yieldPredictionSchema.statics.getYieldTrend = async function(farmId, cropType, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  const predictions = await this.find({
    farmId,
    cropType,
    predictionDate: { $gte: startDate }
  }).sort({ predictionDate: 1 });
  
  if (predictions.length < 2) return null;
  
  const yields = predictions.map(p => p.predictedYield);
  const firstYield = yields[0];
  const lastYield = yields[yields.length - 1];
  const trend = ((lastYield - firstYield) / firstYield) * 100;
  
  return {
    trend: trend > 5 ? 'increasing' : trend < -5 ? 'decreasing' : 'stable',
    percentage: Math.round(trend * 100) / 100,
    dataPoints: predictions.length
  };
};

module.exports = mongoose.model('YieldPrediction', yieldPredictionSchema);
