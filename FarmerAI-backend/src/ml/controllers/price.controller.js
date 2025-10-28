// Price Prediction Controller
const MLService = require('../services/ml-service');
const PriceForecast = require('../models/PriceForecast');
const MarketData = require('../models/MarketData');

// Get price forecast for specific crop
const getPriceForecast = async (req, res) => {
  try {
    const { crop } = req.params;
    const userId = req.user.id || req.user._id;
    const { days = 30 } = req.query;

    // Get historical price data
    const historicalData = await MarketData.find({ crop })
      .sort({ date: -1 })
      .limit(365) // Last year of data
      .select('price date volume marketFactors');

    if (historicalData.length < 30) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient historical data for price forecasting'
      });
    }

    // Get external factors (weather, market conditions, etc.)
    const externalFactors = {
      season: getCurrentSeason(),
      weatherForecast: await getWeatherForecast(),
      marketTrends: await getMarketTrendsData(),
      economicIndicators: await getEconomicIndicators()
    };

    // Call ML service for price prediction
    const mlResult = await MLService.predictPrice(crop, historicalData, externalFactors);

    if (!mlResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Price prediction failed',
        error: mlResult.error
      });
    }

    const { predictions, confidence, factors, trend } = mlResult.data;

    // Save forecast to database
    const priceForecast = new PriceForecast({
      crop,
      userId,
      predictions: predictions.map(p => ({
        date: new Date(p.date),
        price: p.price,
        confidence: p.confidence,
        factors: p.factors || []
      })),
      confidence: confidence,
      factors: factors || [],
      trend: trend || 'stable',
      period: parseInt(days),
      currentPrice: historicalData[0]?.price || 0,
      lastUpdated: new Date()
    });

    await priceForecast.save();

    // Log the operation
    await MLService.logMLOperation(
      'price_prediction',
      'price-prediction',
      userId,
      { crop, days, historicalDataCount: historicalData.length },
      mlResult.data
    );

    res.json({
      success: true,
      data: {
        crop,
        currentPrice: priceForecast.currentPrice,
        predictions: priceForecast.predictions,
        confidence: priceForecast.confidence,
        trend: priceForecast.trend,
        factors: priceForecast.factors,
        forecastId: priceForecast._id,
        lastUpdated: priceForecast.lastUpdated
      }
    });

  } catch (error) {
    console.error('Price forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during price forecasting',
      error: error.message
    });
  }
};

// Get market trends analysis
const getMarketTrends = async (req, res) => {
  try {
    const { crops = ['Rice', 'Wheat', 'Maize'], period = '30' } = req.query;
    const userId = req.user.id || req.user._id;

    const cropArray = Array.isArray(crops) ? crops : [crops];
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const trends = {};

    for (const crop of cropArray) {
      const marketData = await MarketData.find({
        crop,
        date: { $gte: startDate }
      }).sort({ date: 1 });

      if (marketData.length > 0) {
        const prices = marketData.map(d => d.price);
        const volumes = marketData.map(d => d.volume || 0);
        
        trends[crop] = {
          currentPrice: prices[prices.length - 1],
          priceChange: prices.length > 1 ? prices[prices.length - 1] - prices[0] : 0,
          priceChangePercent: prices.length > 1 ? 
            ((prices[prices.length - 1] - prices[0]) / prices[0]) * 100 : 0,
          averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
          averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
          trend: getPriceTrend(prices),
          volatility: calculateVolatility(prices),
          dataPoints: marketData.length
        };
      }
    }

    res.json({
      success: true,
      data: {
        trends,
        period: `${period} days`,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get market trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch market trends',
      error: error.message
    });
  }
};

// Set price alert
const setPriceAlert = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { crop, threshold, alertType, enabled = true } = req.body;

    if (!crop || !threshold || !alertType) {
      return res.status(400).json({
        success: false,
        message: 'Crop, threshold, and alert type are required'
      });
    }

    const alert = {
      userId,
      crop,
      threshold: parseFloat(threshold),
      alertType, // 'price_increase', 'price_decrease', 'price_target'
      enabled,
      createdAt: new Date()
    };

    // TODO: Implement proper alert storage and notification system
    console.log('Price alert set:', alert);

    res.json({
      success: true,
      data: alert,
      message: 'Price alert set successfully'
    });

  } catch (error) {
    console.error('Set price alert error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set price alert',
      error: error.message
    });
  }
};

// Get price history for crop
const getPriceHistory = async (req, res) => {
  try {
    const { crop } = req.params;
    const { period = '365', page = 1, limit = 100 } = req.query;
    const userId = req.user.id || req.user._id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const marketData = await MarketData.find({
      crop,
      date: { $gte: startDate }
    })
    .sort({ date: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .select('price date volume marketFactors');

    const total = await MarketData.countDocuments({
      crop,
      date: { $gte: startDate }
    });

    res.json({
      success: true,
      data: {
        history: marketData,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        },
        period: `${period} days`
      }
    });

  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price history',
      error: error.message
    });
  }
};

// Get price analysis for crop
const getPriceAnalysis = async (req, res) => {
  try {
    const { crop } = req.params;
    const { period = '365' } = req.query;
    const userId = req.user.id || req.user._id;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const marketData = await MarketData.find({
      crop,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    if (marketData.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient data for price analysis'
      });
    }

    const prices = marketData.map(d => d.price);
    const volumes = marketData.map(d => d.volume || 0);

    const analysis = {
      basic: {
        currentPrice: prices[prices.length - 1],
        highestPrice: Math.max(...prices),
        lowestPrice: Math.min(...prices),
        averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
        priceRange: Math.max(...prices) - Math.min(...prices)
      },
      trends: {
        shortTerm: getPriceTrend(prices.slice(-30)), // Last 30 days
        mediumTerm: getPriceTrend(prices.slice(-90)), // Last 90 days
        longTerm: getPriceTrend(prices) // Full period
      },
      volatility: {
        standardDeviation: calculateVolatility(prices),
        coefficientOfVariation: calculateVolatility(prices) / (prices.reduce((a, b) => a + b, 0) / prices.length),
        maxDrawdown: calculateMaxDrawdown(prices)
      },
      volume: {
        averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length,
        volumeTrend: getVolumeTrend(volumes),
        correlation: calculatePriceVolumeCorrelation(prices, volumes)
      },
      seasonality: {
        monthlyAverages: calculateMonthlyAverages(marketData),
        seasonalPattern: detectSeasonalPattern(marketData)
      }
    };

    res.json({
      success: true,
      data: {
        crop,
        analysis,
        period: `${period} days`,
        dataPoints: marketData.length,
        lastUpdated: new Date()
      }
    });

  } catch (error) {
    console.error('Get price analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch price analysis',
      error: error.message
    });
  }
};

// Helper functions
function getCurrentSeason() {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

async function getWeatherForecast() {
  // TODO: Implement weather forecast API integration
  return {
    temperature: 25,
    humidity: 60,
    rainfall: 0,
    windSpeed: 10
  };
}

async function getMarketTrendsData() {
  // TODO: Implement market trends API integration
  return {
    globalDemand: 'stable',
    supply: 'normal',
    tradeRestrictions: 'none'
  };
}

async function getEconomicIndicators() {
  // TODO: Implement economic indicators API integration
  return {
    inflation: 3.5,
    gdpGrowth: 2.1,
    currencyStrength: 'stable'
  };
}

function getPriceTrend(prices) {
  if (prices.length < 2) return 'stable';
  const first = prices[0];
  const last = prices[prices.length - 1];
  const change = (last - first) / first;
  if (change > 0.05) return 'increasing';
  if (change < -0.05) return 'decreasing';
  return 'stable';
}

function calculateVolatility(prices) {
  if (prices.length < 2) return 0;
  const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
  const variance = prices.reduce((sum, price) => sum + Math.pow(price - mean, 2), 0) / prices.length;
  return Math.sqrt(variance);
}

function calculateMaxDrawdown(prices) {
  let maxDrawdown = 0;
  let peak = prices[0];
  
  for (let i = 1; i < prices.length; i++) {
    if (prices[i] > peak) {
      peak = prices[i];
    } else {
      const drawdown = (peak - prices[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

function getVolumeTrend(volumes) {
  if (volumes.length < 2) return 'stable';
  const first = volumes[0];
  const last = volumes[volumes.length - 1];
  const change = (last - first) / first;
  if (change > 0.1) return 'increasing';
  if (change < -0.1) return 'decreasing';
  return 'stable';
}

function calculatePriceVolumeCorrelation(prices, volumes) {
  if (prices.length !== volumes.length || prices.length < 2) return 0;
  
  const n = prices.length;
  const sumP = prices.reduce((a, b) => a + b, 0);
  const sumV = volumes.reduce((a, b) => a + b, 0);
  const sumPV = prices.reduce((sum, price, i) => sum + price * volumes[i], 0);
  const sumP2 = prices.reduce((sum, price) => sum + price * price, 0);
  const sumV2 = volumes.reduce((sum, volume) => sum + volume * volume, 0);
  
  const numerator = n * sumPV - sumP * sumV;
  const denominator = Math.sqrt((n * sumP2 - sumP * sumP) * (n * sumV2 - sumV * sumV));
  
  return denominator === 0 ? 0 : numerator / denominator;
}

function calculateMonthlyAverages(marketData) {
  const monthlyData = {};
  
  marketData.forEach(data => {
    const month = new Date(data.date).getMonth();
    if (!monthlyData[month]) {
      monthlyData[month] = { prices: [], volumes: [] };
    }
    monthlyData[month].prices.push(data.price);
    monthlyData[month].volumes.push(data.volume || 0);
  });
  
  const monthlyAverages = {};
  Object.keys(monthlyData).forEach(month => {
    const prices = monthlyData[month].prices;
    const volumes = monthlyData[month].volumes;
    monthlyAverages[month] = {
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length,
      averageVolume: volumes.reduce((a, b) => a + b, 0) / volumes.length
    };
  });
  
  return monthlyAverages;
}

function detectSeasonalPattern(marketData) {
  // Simple seasonal pattern detection
  const monthlyAverages = calculateMonthlyAverages(marketData);
  const months = Object.keys(monthlyAverages).map(Number).sort((a, b) => a - b);
  
  if (months.length < 3) return 'insufficient_data';
  
  const prices = months.map(month => monthlyAverages[month].averagePrice);
  const maxPrice = Math.max(...prices);
  const minPrice = Math.min(...prices);
  const range = maxPrice - minPrice;
  
  if (range < maxPrice * 0.1) return 'stable';
  if (range >= maxPrice * 0.3) return 'highly_seasonal';
  return 'moderately_seasonal';
}

module.exports = {
  getPriceForecast,
  getMarketTrends,
  setPriceAlert,
  getPriceHistory,
  getPriceAnalysis
};
