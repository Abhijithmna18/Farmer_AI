import React, { useState, useEffect } from 'react';
import { TrendingUp, BarChart3, AlertTriangle, CheckCircle, Calendar, Target } from 'lucide-react';

const YieldPrediction = () => {
  const [formData, setFormData] = useState({
    farmId: '',
    cropType: '',
    nitrogen: '',
    phosphorus: '',
    potassium: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: '',
    soilType: 'loamy',
    irrigationMethod: 'drip',
    plantingDate: '',
    expectedHarvestDate: ''
  });
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  const cropTypes = ['Rice', 'Wheat', 'Maize', 'Tomato', 'Potato', 'Sugarcane', 'Cotton'];
  const soilTypes = ['Sandy', 'Loamy', 'Clay', 'Silty'];
  const irrigationMethods = ['Drip', 'Sprinkler', 'Flood', 'Manual'];

  useEffect(() => {
    // Load prediction history
    loadPredictionHistory();
  }, []);

  const loadPredictionHistory = async () => {
    try {
      // Simulate API call
      setTimeout(() => {
        setHistory([
          {
            id: 1,
            cropType: 'Rice',
            predictedYield: 1200,
            confidence: 87,
            date: '2024-01-15',
            status: 'Active'
          },
          {
            id: 2,
            cropType: 'Wheat',
            predictedYield: 800,
            confidence: 92,
            date: '2024-01-10',
            status: 'Completed'
          }
        ]);
      }, 500);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      setTimeout(() => {
        const mockPrediction = {
          predictionId: 'pred_' + Date.now(),
          cropType: formData.cropType,
          predictedYield: Math.floor(Math.random() * 1000) + 500,
          confidence: Math.floor(Math.random() * 30) + 70,
          recommendations: [
            {
              type: 'fertilizer',
              priority: 'high',
              message: 'Increase nitrogen application for better yield',
              expectedImpact: '15-25% yield increase'
            },
            {
              type: 'soil_management',
              priority: 'medium',
              message: 'Adjust soil pH to optimal range (6.0-7.5)',
              expectedImpact: '10-15% yield improvement'
            }
          ],
          inputFeatures: formData,
          predictionDate: new Date().toISOString(),
          modelVersion: '1.0.0'
        };
        setPrediction(mockPrediction);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Prediction failed:', error);
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Yield Prediction</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Predict crop yield using AI-powered ANN regression analysis
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Prediction Form */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Input Parameters</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Farm ID
                  </label>
                  <input
                    type="text"
                    name="farmId"
                    value={formData.farmId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="Enter farm ID"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Crop Type
                  </label>
                  <select
                    name="cropType"
                    value={formData.cropType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  >
                    <option value="">Select crop type</option>
                    {cropTypes.map(crop => (
                      <option key={crop} value={crop}>{crop}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Soil Nutrients */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nitrogen (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="nitrogen"
                    value={formData.nitrogen}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Phosphorus (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="phosphorus"
                    value={formData.phosphorus}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Potassium (kg/ha)
                  </label>
                  <input
                    type="number"
                    name="potassium"
                    value={formData.potassium}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Environmental Factors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Temperature (°C)
                  </label>
                  <input
                    type="number"
                    name="temperature"
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="25"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Humidity (%)
                  </label>
                  <input
                    type="number"
                    name="humidity"
                    value={formData.humidity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="60"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soil pH
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    name="ph"
                    value={formData.ph}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="6.5"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rainfall (mm)
                  </label>
                  <input
                    type="number"
                    name="rainfall"
                    value={formData.rainfall}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    placeholder="100"
                    required
                  />
                </div>
              </div>

              {/* Soil and Irrigation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Soil Type
                  </label>
                  <select
                    name="soilType"
                    value={formData.soilType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    {soilTypes.map(soil => (
                      <option key={soil} value={soil.toLowerCase()}>{soil}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Irrigation Method
                  </label>
                  <select
                    name="irrigationMethod"
                    value={formData.irrigationMethod}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                  >
                    {irrigationMethods.map(method => (
                      <option key={method} value={method.toLowerCase()}>{method}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Planting Date
                  </label>
                  <input
                    type="date"
                    name="plantingDate"
                    value={formData.plantingDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Expected Harvest Date
                  </label>
                  <input
                    type="date"
                    name="expectedHarvestDate"
                    value={formData.expectedHarvestDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Predicting...' : 'Predict Yield'}
              </button>
            </form>
          </div>

          {/* Results */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Prediction Results</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Analyzing parameters...</p>
              </div>
            ) : prediction ? (
              <div className="space-y-6">
                {/* Yield Prediction */}
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold text-green-900 dark:text-green-100">Predicted Yield</h3>
                  </div>
                  <p className="text-2xl font-bold text-green-800 dark:text-green-200">
                    {prediction.predictedYield} kg/hectare
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Confidence: {prediction.confidence}%
                  </p>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">AI Recommendations</h4>
                  <div className="space-y-3">
                    {prediction.recommendations.map((rec, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border ${
                          rec.priority === 'high' || rec.priority === 'critical'
                            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                            : rec.priority === 'medium'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                            : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-1 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{rec.message}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{rec.expectedImpact}</p>
                            <span className={`inline-block text-xs px-2 py-1 rounded-full mt-1 ${getPriorityColor(rec.priority)}`}>
                              {rec.priority} priority
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Model Info */}
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  <p>Model: ANN Regression v{prediction.modelVersion}</p>
                  <p>Prediction Date: {new Date(prediction.predictionDate).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Enter parameters to get yield prediction</p>
              </div>
            )}
          </div>
        </div>

        {/* Prediction History */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Predictions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((item) => (
              <div key={item.id} className="border border-gray-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{item.cropType}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-lg font-bold text-gray-900 dark:text-white">{item.predictedYield} kg/ha</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Confidence: {item.confidence}%</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YieldPrediction;
