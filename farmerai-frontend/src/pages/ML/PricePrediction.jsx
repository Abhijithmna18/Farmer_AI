import React, { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, BarChart3, AlertTriangle, CheckCircle, Calendar } from 'lucide-react';

const PricePrediction = () => {
  const [priceData, setPriceData] = useState({
    currentPrices: [],
    predictions: [],
    trends: [],
    alerts: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedCrop, setSelectedCrop] = useState('Rice');

  useEffect(() => {
    // Load price data from dataset
    loadPriceData();
  }, []);

  const loadPriceData = async () => {
    try {
      // In real implementation, this would fetch from the backend API that uses the dataset
      // For now, simulate data based on the Crop_recommendation.csv dataset
      setTimeout(() => {
        // Simulate price data based on crop types from the dataset
        const cropTypes = ['rice', 'wheat', 'maize', 'tomato', 'potato', 'sugarcane', 'cotton'];
        const currentPrices = cropTypes.map(crop => {
          const basePrice = getBasePriceForCrop(crop);
          const change = (Math.random() - 0.5) * 10; // -5% to +5% change
          return {
            crop: crop.charAt(0).toUpperCase() + crop.slice(1),
            price: Math.round((basePrice * (1 + change / 100)) * 100) / 100,
            change: Math.round(change * 10) / 10,
            trend: change > 0 ? 'up' : 'down'
          };
        });

        const predictions = cropTypes.slice(0, 3).map(crop => {
          const currentPrice = getBasePriceForCrop(crop);
          const predictedChange = (Math.random() - 0.3) * 15; // -15% to +12% prediction
          return {
            crop: crop.charAt(0).toUpperCase() + crop.slice(1),
            currentPrice: Math.round(currentPrice * 100) / 100,
            predictedPrice: Math.round((currentPrice * (1 + predictedChange / 100)) * 100) / 100,
            confidence: Math.floor(Math.random() * 20) + 75, // 75-95% confidence
            timeframe: '1 month'
          };
        });

        const trends = cropTypes.slice(0, 3).map(crop => ({
          crop: crop.charAt(0).toUpperCase() + crop.slice(1),
          trend: ['Bullish', 'Bearish', 'Neutral'][Math.floor(Math.random() * 3)],
          reason: getTrendReason(crop)
        }));

        setPriceData({
          currentPrices,
          predictions,
          trends,
          alerts: [
            { type: 'warning', message: 'Rice prices expected to rise by 6% in next month', crop: 'Rice' },
            { type: 'info', message: 'Wheat prices stabilizing after recent decline', crop: 'Wheat' }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load price data:', error);
      setLoading(false);
    }
  };

  const getBasePriceForCrop = (crop) => {
    // Base prices based on typical market rates for crops in the dataset
    const basePrices = {
      'rice': 45.50,
      'wheat': 38.20,
      'maize': 42.80,
      'tomato': 25.30,
      'potato': 18.75,
      'sugarcane': 32.40,
      'cotton': 55.60
    };
    return basePrices[crop] || 30.00;
  };

  const getTrendReason = (crop) => {
    const reasons = {
      'rice': ['Increased demand from export markets', 'Weather concerns affecting supply', 'Government procurement policies'],
      'wheat': ['High production forecast', 'Storage capacity issues', 'Export restrictions'],
      'maize': ['Stable supply and demand', 'Ethanol production demand', 'Feed industry consumption'],
      'tomato': ['Seasonal price fluctuations', 'Transportation costs', 'Processing industry demand'],
      'potato': ['Storage and cold chain issues', 'Processing industry demand', 'Seasonal availability'],
      'sugarcane': ['Ethanol blending policies', 'Sugar export demand', 'Weather impact on yield'],
      'cotton': ['Textile industry demand', 'Export market conditions', 'Weather and pest issues']
    };
    const cropReasons = reasons[crop] || ['Market conditions', 'Supply and demand factors'];
    return cropReasons[Math.floor(Math.random() * cropReasons.length)];
  };

  const crops = ['Rice', 'Wheat', 'Maize', 'Soybean', 'Cotton', 'Sugarcane'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-3/4 mb-4"></div>
                  <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Price Prediction</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered market price forecasting and trend analysis
          </p>
        </div>

        {/* Crop Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Crop
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            {crops.map((crop) => (
              <option key={crop} value={crop}>{crop}</option>
            ))}
          </select>
        </div>

        {/* Current Prices */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {priceData.currentPrices.map((price, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
                <span className={`text-sm font-medium ${
                  price.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {price.trend === 'up' ? '+' : ''}{price.change}%
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{price.crop}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{price.price}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Per kg</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Price Predictions */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Price Predictions</h2>
            <div className="space-y-4">
              {priceData.predictions.map((prediction, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 dark:text-white">{prediction.crop}</h3>
                    <span className="text-sm font-semibold text-purple-600">{prediction.confidence}% confidence</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Current Price</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{prediction.currentPrice}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Predicted Price</p>
                      <p className="text-lg font-semibold text-purple-600">₹{prediction.predictedPrice}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{prediction.timeframe}</span>
                    <span className={`text-sm font-medium ${
                      prediction.predictedPrice > prediction.currentPrice ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {prediction.predictedPrice > prediction.currentPrice ? '↗' : '↘'} 
                      {Math.abs(((prediction.predictedPrice - prediction.currentPrice) / prediction.currentPrice) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Market Trends */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Market Trends</h2>
            <div className="space-y-4">
              {priceData.trends.map((trend, index) => (
                <div key={index} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{trend.crop}</h3>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      trend.trend === 'Bullish' ? 'bg-green-100 text-green-800' :
                      trend.trend === 'Bearish' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {trend.trend}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{trend.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Price Alerts */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Price Alerts</h2>
          <div className="space-y-3">
            {priceData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{alert.message}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.crop}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricePrediction;

