import React, { useState, useEffect } from 'react';
import { Droplets, Calendar, TrendingUp, AlertCircle, CheckCircle, Settings, Wifi, WifiOff } from 'lucide-react';

const IrrigationAI = () => {
  const [irrigationData, setIrrigationData] = useState({
    currentSchedule: null,
    recommendations: [],
    waterUsage: 0,
    efficiency: 0,
    alerts: []
  });
  const [sensorData, setSensorData] = useState({
    temperature: 0,
    humidity: 0,
    soilMoisture: 0,
    lightIntensity: 0,
    lastUpdated: null,
    connected: false
  });
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState('Field A');

  useEffect(() => {
    // Simulate loading irrigation data with live sensor data
    loadIrrigationData();
    loadSensorData();
    
    // Set up real-time sensor data updates
    const sensorInterval = setInterval(loadSensorData, 5000); // Update every 5 seconds
    
    return () => clearInterval(sensorInterval);
  }, []);

  const loadIrrigationData = async () => {
    try {
      // Simulate API call to get irrigation data
      setTimeout(() => {
        setIrrigationData({
          currentSchedule: {
            field: 'Field A',
            nextIrrigation: '2024-01-15T06:00:00',
            duration: 45,
            waterAmount: 120,
            method: 'Drip Irrigation'
          },
          recommendations: [
            {
              type: 'optimization',
              message: 'Reduce irrigation duration by 15 minutes for better efficiency',
              impact: 'Save 30L of water per session'
            },
            {
              type: 'timing',
              message: 'Schedule irrigation 2 hours earlier to avoid heat stress',
              impact: 'Improve water absorption by 20%'
            },
            {
              type: 'method',
              message: 'Consider switching to sprinkler system for this field',
              impact: 'Better coverage and 15% more efficient'
            }
          ],
          waterUsage: 450,
          efficiency: 78,
          alerts: [
            { type: 'warning', message: 'Soil moisture below optimal level', time: '2 hours ago' },
            { type: 'info', message: 'Irrigation completed successfully', time: '6 hours ago' }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load irrigation data:', error);
      setLoading(false);
    }
  };

  const loadSensorData = async () => {
    try {
      // Simulate fetching live Adafruit IO sensor data
      // In real implementation, this would call the Adafruit IO API
      const mockSensorData = {
        temperature: Math.round((Math.random() * 10 + 20) * 10) / 10, // 20-30°C
        humidity: Math.round((Math.random() * 30 + 40) * 10) / 10, // 40-70%
        soilMoisture: Math.round((Math.random() * 0.6 + 0.2) * 100) / 100, // 0.2-0.8
        lightIntensity: Math.round(Math.random() * 800 + 200), // 200-1000 lux
        lastUpdated: new Date(),
        connected: Math.random() > 0.1 // 90% connection success rate
      };
      
      setSensorData(mockSensorData);
      
      // Update recommendations based on live sensor data
      updateRecommendationsBasedOnSensors(mockSensorData);
    } catch (error) {
      console.error('Failed to load sensor data:', error);
      setSensorData(prev => ({ ...prev, connected: false }));
    }
  };

  const updateRecommendationsBasedOnSensors = (sensorData) => {
    const newRecommendations = [];
    
    // Temperature-based recommendations
    if (sensorData.temperature > 30) {
      newRecommendations.push({
        type: 'timing',
        message: 'High temperature detected - irrigate early morning or evening',
        impact: 'Prevent water evaporation and plant stress'
      });
    }
    
    // Soil moisture-based recommendations
    if (sensorData.soilMoisture < 0.3) {
      newRecommendations.push({
        type: 'urgent',
        message: 'Soil moisture critically low - immediate irrigation needed',
        impact: 'Prevent crop wilting and yield loss'
      });
    } else if (sensorData.soilMoisture > 0.7) {
      newRecommendations.push({
        type: 'optimization',
        message: 'Soil moisture high - reduce irrigation frequency',
        impact: 'Prevent overwatering and root rot'
      });
    }
    
    // Humidity-based recommendations
    if (sensorData.humidity < 40) {
      newRecommendations.push({
        type: 'environment',
        message: 'Low humidity - consider misting or increase irrigation',
        impact: 'Maintain optimal growing conditions'
      });
    }
    
    // Light intensity-based recommendations
    if (sensorData.lightIntensity < 300) {
      newRecommendations.push({
        type: 'environment',
        message: 'Low light intensity - check for shading issues',
        impact: 'Ensure adequate photosynthesis'
      });
    }
    
    setIrrigationData(prev => ({
      ...prev,
      recommendations: newRecommendations
    }));
  };

  const fields = ['Field A', 'Field B', 'Field C', 'Field D'];

  const irrigationMethods = [
    { name: 'Drip Irrigation', efficiency: 90, waterSaving: 'High' },
    { name: 'Sprinkler System', efficiency: 75, waterSaving: 'Medium' },
    { name: 'Flood Irrigation', efficiency: 60, waterSaving: 'Low' },
    { name: 'Micro Sprinklers', efficiency: 85, waterSaving: 'High' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Irrigation AI</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Smart irrigation management powered by AI for optimal water usage
          </p>
        </div>

        {/* Field Selection and Sensor Status */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Field
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {fields.map((field) => (
                <option key={field} value={field}>{field}</option>
              ))}
            </select>
          </div>
          
          {/* Live Sensor Data */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Live Sensor Data</h3>
              <div className="flex items-center gap-2">
                {sensorData.connected ? (
                  <Wifi className="w-4 h-4 text-green-500" />
                ) : (
                  <WifiOff className="w-4 h-4 text-red-500" />
                )}
                <span className={`text-xs ${sensorData.connected ? 'text-green-600' : 'text-red-600'}`}>
                  {sensorData.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-gray-500 dark:text-gray-400">Temperature</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sensorData.temperature}°C</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Humidity</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sensorData.humidity}%</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Soil Moisture</p>
                <p className="font-semibold text-gray-900 dark:text-white">{(sensorData.soilMoisture * 100).toFixed(1)}%</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Light</p>
                <p className="font-semibold text-gray-900 dark:text-white">{sensorData.lightIntensity} lux</p>
              </div>
            </div>
            {sensorData.lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last updated: {sensorData.lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Current Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/20">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {irrigationData.currentSchedule?.duration}m
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Next Irrigation</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              {irrigationData.currentSchedule?.nextIrrigation ? 
                new Date(irrigationData.currentSchedule.nextIrrigation).toLocaleString() : 
                'Not scheduled'
              }
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                <Droplets className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {irrigationData.waterUsage}L
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Water Usage</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Today's consumption</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/20">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {irrigationData.efficiency}%
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Efficiency</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Water usage efficiency</p>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg bg-orange-100 dark:bg-orange-900/20">
                <Settings className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {irrigationData.currentSchedule?.waterAmount}L
              </span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Water Amount</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Per irrigation session</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* AI Recommendations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Recommendations</h2>
            <div className="space-y-4">
              {irrigationData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.type === 'optimization'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : rec.type === 'timing'
                      ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                      : 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">{rec.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.impact}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Irrigation Methods */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Irrigation Methods</h2>
            <div className="space-y-4">
              {irrigationMethods.map((method, index) => (
                <div
                  key={index}
                  className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900 dark:text-white">{method.name}</h3>
                    <span className="text-sm font-semibold text-blue-600">{method.efficiency}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Efficiency</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      method.waterSaving === 'High' ? 'bg-green-100 text-green-800' :
                      method.waterSaving === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {method.waterSaving} Water Saving
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="mt-8 bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Alerts</h2>
          <div className="space-y-3">
            {irrigationData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                }`}
              >
                <AlertCircle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                  alert.type === 'warning' ? 'text-yellow-500' : 'text-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{alert.message}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IrrigationAI;

