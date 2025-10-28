// Market Data Model
const mongoose = require('mongoose');

const MarketDataSchema = new mongoose.Schema({
  crop: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  date: {
    type: Date,
    required: true
  },
  volume: {
    type: Number,
    min: 0,
    default: 0
  },
  marketFactors: [{
    type: String,
    trim: true
  }],
  location: {
    type: String,
    trim: true,
    default: 'National'
  },
  quality: {
    type: String,
    enum: ['Grade A', 'Grade B', 'Grade C', 'Mixed', 'Unknown'],
    default: 'Unknown'
  },
  source: {
    type: String,
    enum: ['Government', 'Private', 'Cooperative', 'Online', 'Other'],
    default: 'Government'
  },
  currency: {
    type: String,
    default: 'INR'
  },
  unit: {
    type: String,
    default: 'kg'
  },
  marketType: {
    type: String,
    enum: ['Wholesale', 'Retail', 'Farm Gate', 'Export', 'Import'],
    default: 'Wholesale'
  },
  season: {
    type: String,
    enum: ['Kharif', 'Rabi', 'Zaid', 'All Year'],
    default: 'All Year'
  },
  region: {
    type: String,
    trim: true,
    default: 'India'
  },
  weatherImpact: {
    type: String,
    enum: ['Positive', 'Negative', 'Neutral', 'Unknown'],
    default: 'Unknown'
  },
  demandLevel: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Very High'],
    default: 'Normal'
  },
  supplyLevel: {
    type: String,
    enum: ['Low', 'Normal', 'High', 'Excess'],
    default: 'Normal'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
MarketDataSchema.index({ crop: 1, date: -1 });
MarketDataSchema.index({ date: -1 });
MarketDataSchema.index({ location: 1 });
MarketDataSchema.index({ marketType: 1 });
MarketDataSchema.index({ season: 1 });
MarketDataSchema.index({ region: 1 });

// Virtual for price per unit
MarketDataSchema.virtual('pricePerUnit').get(function() {
  return this.volume > 0 ? this.price / this.volume : this.price;
});

// Virtual for formatted date
MarketDataSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString().split('T')[0];
});

// Method to calculate price change from previous day
MarketDataSchema.methods.calculatePriceChange = async function() {
  const previousDay = new Date(this.date);
  previousDay.setDate(previousDay.getDate() - 1);
  
  const previousData = await this.constructor.findOne({
    crop: this.crop,
    date: previousDay,
    location: this.location,
    marketType: this.marketType
  });
  
  if (!previousData) return null;
  
  const change = this.price - previousData.price;
  const changePercent = (change / previousData.price) * 100;
  
  return {
    absolute: change,
    percentage: changePercent,
    previousPrice: previousData.price
  };
};

// Method to get price trend
MarketDataSchema.methods.getPriceTrend = async function(days = 7) {
  const startDate = new Date(this.date);
  startDate.setDate(startDate.getDate() - days);
  
  const historicalData = await this.constructor.find({
    crop: this.crop,
    date: { $gte: startDate, $lte: this.date },
    location: this.location,
    marketType: this.marketType
  }).sort({ date: 1 });
  
  if (historicalData.length < 2) return 'insufficient_data';
  
  const prices = historicalData.map(d => d.price);
  const firstPrice = prices[0];
  const lastPrice = prices[prices.length - 1];
  const changePercent = ((lastPrice - firstPrice) / firstPrice) * 100;
  
  if (changePercent > 5) return 'increasing';
  if (changePercent < -5) return 'decreasing';
  return 'stable';
};

// Static method to get price statistics
MarketDataSchema.statics.getPriceStats = function(crop, startDate, endDate) {
  return this.aggregate([
    {
      $match: {
        crop: crop,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
        totalVolume: { $sum: '$volume' },
        count: { $sum: 1 }
      }
    }
  ]);
};

// Static method to get price trends
MarketDataSchema.statics.getPriceTrends = function(crop, period = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.find({
    crop: crop,
    date: { $gte: startDate, $lte: endDate }
  })
  .sort({ date: 1 })
  .select('price date volume');
};

// Static method to get market insights
MarketDataSchema.statics.getMarketInsights = function(crop, period = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    {
      $match: {
        crop: crop,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          location: '$location',
          marketType: '$marketType'
        },
        avgPrice: { $avg: '$price' },
        totalVolume: { $sum: '$volume' },
        count: { $sum: 1 },
        demandLevel: { $first: '$demandLevel' },
        supplyLevel: { $first: '$supplyLevel' }
      }
    },
    {
      $sort: { avgPrice: -1 }
    }
  ]);
};

// Static method to get seasonal patterns
MarketDataSchema.statics.getSeasonalPatterns = function(crop, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);
  
  return this.aggregate([
    {
      $match: {
        crop: crop,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: {
          month: { $month: '$date' },
          season: '$season'
        },
        avgPrice: { $avg: '$price' },
        avgVolume: { $avg: '$volume' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.month': 1 }
    }
  ]);
};

// Static method to get price volatility
MarketDataSchema.statics.getPriceVolatility = function(crop, period = 30) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.aggregate([
    {
      $match: {
        crop: crop,
        date: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        prices: { $push: '$price' },
        avgPrice: { $avg: '$price' }
      }
    },
    {
      $project: {
        volatility: {
          $let: {
            vars: {
              prices: '$prices',
              avg: '$avgPrice'
            },
            in: {
              $sqrt: {
                $divide: [
                  {
                    $sum: {
                      $map: {
                        input: '$$prices',
                        as: 'price',
                        in: { $pow: [{ $subtract: ['$$price', '$$avg'] }, 2] }
                      }
                    }
                  },
                  { $size: '$$prices' }
                ]
              }
            }
          }
        },
        avgPrice: 1,
        count: { $size: '$prices' }
      }
    }
  ]);
};

// Pre-save middleware to validate data
MarketDataSchema.pre('save', function(next) {
  // Ensure price is positive
  if (this.price < 0) this.price = 0;
  
  // Ensure volume is non-negative
  if (this.volume < 0) this.volume = 0;
  
  // Set season based on date if not provided
  if (!this.season || this.season === 'All Year') {
    const month = this.date.getMonth();
    if (month >= 6 && month <= 10) {
      this.season = 'Kharif';
    } else if (month >= 11 || month <= 3) {
      this.season = 'Rabi';
    } else {
      this.season = 'Zaid';
    }
  }
  
  next();
});

module.exports = mongoose.model('MarketData', MarketDataSchema);

