// Price Forecast Model
const mongoose = require('mongoose');

const PriceForecastSchema = new mongoose.Schema({
  crop: {
    type: String,
    required: true,
    trim: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  predictions: [{
    date: {
      type: Date,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    factors: [{
      type: String,
      trim: true
    }]
  }],
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  factors: [{
    type: String,
    trim: true
  }],
  trend: {
    type: String,
    enum: ['increasing', 'decreasing', 'stable', 'volatile'],
    required: true
  },
  period: {
    type: Number,
    required: true,
    min: 1,
    max: 365
  },
  currentPrice: {
    type: Number,
    required: true,
    min: 0
  },
  lastUpdated: {
    type: Date,
    required: true
  },
  accuracy: {
    type: Number,
    min: 0,
    max: 1,
    default: null
  },
  modelVersion: {
    type: String,
    default: '1.0'
  },
  marketConditions: {
    supply: {
      type: String,
      enum: ['low', 'normal', 'high', 'excess'],
      default: 'normal'
    },
    demand: {
      type: String,
      enum: ['low', 'normal', 'high', 'excess'],
      default: 'normal'
    },
    seasonality: {
      type: String,
      enum: ['low', 'moderate', 'high'],
      default: 'moderate'
    },
    externalFactors: [{
      type: String,
      trim: true
    }]
  }
}, {
  timestamps: true
});

// Indexes for better query performance
PriceForecastSchema.index({ crop: 1, userId: 1, createdAt: -1 });
PriceForecastSchema.index({ trend: 1 });
PriceForecastSchema.index({ confidence: 1 });
PriceForecastSchema.index({ 'predictions.date': 1 });

// Virtual for average predicted price
PriceForecastSchema.virtual('averagePredictedPrice').get(function() {
  if (this.predictions.length === 0) return 0;
  const sum = this.predictions.reduce((total, pred) => total + pred.price, 0);
  return sum / this.predictions.length;
});

// Virtual for price change percentage
PriceForecastSchema.virtual('priceChangePercent').get(function() {
  if (this.predictions.length === 0) return 0;
  const firstPrice = this.predictions[0].price;
  const lastPrice = this.predictions[this.predictions.length - 1].price;
  return ((lastPrice - firstPrice) / firstPrice) * 100;
});

// Virtual for confidence percentage
PriceForecastSchema.virtual('confidencePercentage').get(function() {
  return Math.round(this.confidence * 100);
});

// Method to add prediction
PriceForecastSchema.methods.addPrediction = function(predictionData) {
  this.predictions.push({
    date: predictionData.date,
    price: predictionData.price,
    confidence: predictionData.confidence || 0.8,
    factors: predictionData.factors || []
  });
  
  // Sort predictions by date
  this.predictions.sort((a, b) => a.date - b.date);
  
  return this.save();
};

// Method to update accuracy
PriceForecastSchema.methods.updateAccuracy = function(actualPrices) {
  if (actualPrices.length !== this.predictions.length) {
    throw new Error('Actual prices count must match predictions count');
  }
  
  let totalError = 0;
  this.predictions.forEach((pred, index) => {
    const actualPrice = actualPrices[index];
    const error = Math.abs(pred.price - actualPrice) / actualPrice;
    totalError += error;
  });
  
  this.accuracy = 1 - (totalError / this.predictions.length);
  return this.save();
};

// Method to get predictions by date range
PriceForecastSchema.methods.getPredictionsByDateRange = function(startDate, endDate) {
  return this.predictions.filter(pred => 
    pred.date >= startDate && pred.date <= endDate
  );
};

// Method to get high confidence predictions
PriceForecastSchema.methods.getHighConfidencePredictions = function(threshold = 0.8) {
  return this.predictions.filter(pred => pred.confidence >= threshold);
};

// Static method to get forecasts by crop
PriceForecastSchema.statics.getForecastsByCrop = function(crop, userId) {
  return this.find({ crop, userId })
    .sort({ createdAt: -1 })
    .select('-__v');
};

// Static method to get recent forecasts
PriceForecastSchema.statics.getRecentForecasts = function(userId, limit = 10) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

// Static method to get forecasts by trend
PriceForecastSchema.statics.getForecastsByTrend = function(trend, userId) {
  return this.find({ trend, userId })
    .sort({ createdAt: -1 })
    .select('-__v');
};

// Static method to get accuracy statistics
PriceForecastSchema.statics.getAccuracyStats = function(userId, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    {
      $match: {
        userId: userId,
        createdAt: { $gte: startDate },
        accuracy: { $ne: null }
      }
    },
    {
      $group: {
        _id: '$crop',
        avgAccuracy: { $avg: '$accuracy' },
        count: { $sum: 1 },
        avgConfidence: { $avg: '$confidence' }
      }
    },
    {
      $sort: { avgAccuracy: -1 }
    }
  ]);
};

// Static method to get market insights
PriceForecastSchema.statics.getMarketInsights = function(crop, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    {
      $match: {
        crop: crop,
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        avgConfidence: { $avg: '$confidence' },
        trendDistribution: { $push: '$trend' },
        avgPriceChange: { $avg: '$priceChangePercent' },
        totalForecasts: { $sum: 1 }
      }
    }
  ]);
};

// Pre-save middleware to validate data
PriceForecastSchema.pre('save', function(next) {
  // Ensure confidence is between 0 and 1
  if (this.confidence < 0) this.confidence = 0;
  if (this.confidence > 1) this.confidence = 1;
  
  // Ensure accuracy is between 0 and 1 if provided
  if (this.accuracy !== null) {
    if (this.accuracy < 0) this.accuracy = 0;
    if (this.accuracy > 1) this.accuracy = 1;
  }
  
  // Sort predictions by date
  this.predictions.sort((a, b) => a.date - b.date);
  
  // Update lastUpdated timestamp
  this.lastUpdated = new Date();
  
  next();
});

// Post-save middleware to log forecast creation
PriceForecastSchema.post('save', function(doc) {
  console.log(`Price forecast created for ${doc.crop} with ${doc.predictions.length} predictions`);
});

module.exports = mongoose.model('PriceForecast', PriceForecastSchema);

