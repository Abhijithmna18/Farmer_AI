import React, { useState, useEffect } from 'react';
import { Shield, Activity, AlertTriangle, CheckCircle, TrendingUp, Droplets, Sun, Wifi, WifiOff } from 'lucide-react';

const HealthMonitor = () => {
  const [healthData, setHealthData] = useState({
    overallScore: 0,
    fieldScores: [],
    anomalies: [],
    recommendations: [],
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
    // Load initial health data
    loadHealthData();
    loadSensorData();
    
    // Set up real-time sensor data updates
    const sensorInterval = setInterval(loadSensorData, 3000); // Update every 3 seconds
    
    return () => clearInterval(sensorInterval);
  }, []);

  const loadHealthData = async () => {
    try {
      // Simulate API call to get health data
      setTimeout(() => {
        setHealthData({
          overallScore: 82,
          fieldScores: [
            { field: 'Field A', score: 85, status: 'Good', issues: 2 },
            { field: 'Field B', score: 78, status: 'Fair', issues: 4 },
            { field: 'Field C', score: 92, status: 'Excellent', issues: 1 },
            { field: 'Field D', score: 65, status: 'Poor', issues: 7 }
          ],
          anomalies: [
            { type: 'moisture', field: 'Field B', severity: 'High', message: 'Soil moisture below optimal range' },
            { type: 'nutrients', field: 'Field D', severity: 'Medium', message: 'Nitrogen levels insufficient' },
            { type: 'temperature', field: 'Field A', severity: 'Low', message: 'Temperature slightly elevated' }
          ],
          recommendations: [
            { type: 'irrigation', message: 'Increase irrigation frequency for Field B', priority: 'High' },
            { type: 'fertilizer', message: 'Apply nitrogen-rich fertilizer to Field D', priority: 'High' },
            { type: 'monitoring', message: 'Monitor temperature trends in Field A', priority: 'Medium' }
          ],
          alerts: [
            { type: 'warning', message: 'Field D health score dropped below 70%', time: '1 hour ago' },
            { type: 'info', message: 'Field C achieved excellent health rating', time: '3 hours ago' }
          ]
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to load health data:', error);
      setLoading(false);
    }
  };

  const loadSensorData = async () => {
    try {
      // Simulate fetching live Adafruit IO sensor data
      // In real implementation, this would call the Adafruit IO API
      const mockSensorData = {
        temperature: Math.round((Math.random() * 15 + 15) * 10) / 10, // 15-30°C
        humidity: Math.round((Math.random() * 40 + 30) * 10) / 10, // 30-70%
        soilMoisture: Math.round((Math.random() * 0.7 + 0.1) * 100) / 100, // 0.1-0.8
        lightIntensity: Math.round(Math.random() * 1000 + 100), // 100-1100 lux
        lastUpdated: new Date(),
        connected: Math.random() > 0.05 // 95% connection success rate
      };
      
      setSensorData(mockSensorData);
      
      // Update health data based on live sensor readings
      updateHealthBasedOnSensors(mockSensorData);
    } catch (error) {
      console.error('Failed to load sensor data:', error);
      setSensorData(prev => ({ ...prev, connected: false }));
    }
  };

  const updateHealthBasedOnSensors = (sensorData) => {
    // Calculate health score based on sensor data
    let healthScore = 100;
    const anomalies = [];
    const recommendations = [];
    
    // Temperature analysis
    if (sensorData.temperature < 10 || sensorData.temperature > 40) {
      healthScore -= 20;
      anomalies.push({
        type: 'temperature',
        field: selectedField,
        severity: 'High',
        message: `Temperature ${sensorData.temperature}°C is outside optimal range (15-35°C)`
      });
      recommendations.push({
        type: 'environment',
        message: 'Adjust temperature control measures',
        priority: 'High'
      });
    } else if (sensorData.temperature < 15 || sensorData.temperature > 35) {
      healthScore -= 10;
      anomalies.push({
        type: 'temperature',
        field: selectedField,
        severity: 'Medium',
        message: `Temperature ${sensorData.temperature}°C is suboptimal`
      });
    }
    
    // Humidity analysis
    if (sensorData.humidity < 30 || sensorData.humidity > 90) {
      healthScore -= 15;
      anomalies.push({
        type: 'humidity',
        field: selectedField,
        severity: 'High',
        message: `Humidity ${sensorData.humidity}% is outside optimal range (40-80%)`
      });
      recommendations.push({
        type: 'environment',
        message: 'Adjust humidity control measures',
        priority: 'High'
      });
    } else if (sensorData.humidity < 40 || sensorData.humidity > 80) {
      healthScore -= 8;
      anomalies.push({
        type: 'humidity',
        field: selectedField,
        severity: 'Medium',
        message: `Humidity ${sensorData.humidity}% is suboptimal`
      });
    }
    
    // Soil moisture analysis
    if (sensorData.soilMoisture < 0.2 || sensorData.soilMoisture > 0.8) {
      healthScore -= 25;
      anomalies.push({
        type: 'moisture',
        field: selectedField,
        severity: 'Critical',
        message: `Soil moisture ${(sensorData.soilMoisture * 100).toFixed(1)}% is critical`
      });
      recommendations.push({
        type: 'irrigation',
        message: 'Immediate irrigation adjustment needed',
        priority: 'Critical'
      });
    } else if (sensorData.soilMoisture < 0.3 || sensorData.soilMoisture > 0.7) {
      healthScore -= 12;
      anomalies.push({
        type: 'moisture',
        field: selectedField,
        severity: 'High',
        message: `Soil moisture ${(sensorData.soilMoisture * 100).toFixed(1)}% needs attention`
      });
      recommendations.push({
        type: 'irrigation',
        message: 'Adjust irrigation schedule',
        priority: 'High'
      });
    }
    
    // Light intensity analysis
    if (sensorData.lightIntensity < 200 || sensorData.lightIntensity > 1000) {
      healthScore -= 10;
      anomalies.push({
        type: 'light',
        field: selectedField,
        severity: 'Medium',
        message: `Light intensity ${sensorData.lightIntensity} lux is suboptimal`
      });
      recommendations.push({
        type: 'environment',
        message: 'Check for shading or lighting issues',
        priority: 'Medium'
      });
    }
    
    // Update health data
    setHealthData(prev => ({
      ...prev,
      overallScore: Math.max(0, Math.min(100, healthScore)),
      anomalies: [...prev.anomalies.filter(a => a.field !== selectedField), ...anomalies],
      recommendations: [...prev.recommendations.filter(r => r.type !== 'sensor'), ...recommendations]
    }));
  };

  const fields = ['Field A', 'Field B', 'Field C', 'Field D'];

  const healthMetrics = [
    { name: 'Soil Moisture', value: 75, unit: '%', status: 'Good', icon: Droplets },
    { name: 'Nutrient Levels', value: 68, unit: '%', status: 'Fair', icon: Activity },
    { name: 'Temperature', value: 28, unit: '°C', status: 'Good', icon: Sun },
    { name: 'pH Level', value: 6.8, unit: '', status: 'Excellent', icon: Shield }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-green-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Health Monitor</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            AI-powered crop health monitoring and anomaly detection
          </p>
        </div>

        {/* Overall Health Score */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Overall Health Score</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Last updated: 2 hours ago</span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-4xl font-bold text-green-600">{healthData.overallScore}</div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-slate-700 rounded-full h-3">
                <div 
                  className="bg-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${healthData.overallScore}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {healthData.overallScore >= 80 ? 'Excellent' : 
                 healthData.overallScore >= 70 ? 'Good' : 
                 healthData.overallScore >= 60 ? 'Fair' : 'Poor'} Health Status
              </p>
            </div>
          </div>
        </div>

        {/* Field Selection and Live Sensor Data */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Field
            </label>
            <select
              value={selectedField}
              onChange={(e) => setSelectedField(e.target.value)}
              className="bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
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
                <p className={`font-semibold ${
                  sensorData.temperature < 15 || sensorData.temperature > 35 
                    ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {sensorData.temperature}°C
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Humidity</p>
                <p className={`font-semibold ${
                  sensorData.humidity < 40 || sensorData.humidity > 80 
                    ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {sensorData.humidity}%
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Soil Moisture</p>
                <p className={`font-semibold ${
                  sensorData.soilMoisture < 0.3 || sensorData.soilMoisture > 0.7 
                    ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {(sensorData.soilMoisture * 100).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400">Light</p>
                <p className={`font-semibold ${
                  sensorData.lightIntensity < 200 || sensorData.lightIntensity > 1000 
                    ? 'text-red-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {sensorData.lightIntensity} lux
                </p>
              </div>
            </div>
            {sensorData.lastUpdated && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Last updated: {sensorData.lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
        </div>

        {/* Field Health Scores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthData.fieldScores.map((field, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${
                  field.status === 'Excellent' ? 'bg-green-100 dark:bg-green-900/20' :
                  field.status === 'Good' ? 'bg-blue-100 dark:bg-blue-900/20' :
                  field.status === 'Fair' ? 'bg-yellow-100 dark:bg-yellow-900/20' :
                  'bg-red-100 dark:bg-red-900/20'
                }`}>
                  <Shield className={`w-6 h-6 ${
                    field.status === 'Excellent' ? 'text-green-600' :
                    field.status === 'Good' ? 'text-blue-600' :
                    field.status === 'Fair' ? 'text-yellow-600' :
                    'text-red-600'
                  }`} />
                </div>
                <span className={`text-sm font-medium ${
                  field.status === 'Excellent' ? 'text-green-600' :
                  field.status === 'Good' ? 'text-blue-600' :
                  field.status === 'Fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {field.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{field.field}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{field.score}%</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{field.issues} issues detected</p>
            </div>
          ))}
        </div>

        {/* Health Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {healthMetrics.map((metric, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/20">
                  <metric.icon className="w-6 h-6 text-green-600" />
                </div>
                <span className={`text-sm font-medium ${
                  metric.status === 'Excellent' ? 'text-green-600' :
                  metric.status === 'Good' ? 'text-blue-600' :
                  metric.status === 'Fair' ? 'text-yellow-600' :
                  'text-red-600'
                }`}>
                  {metric.status}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{metric.name}</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}{metric.unit}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Anomalies */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Detected Anomalies</h2>
            <div className="space-y-4">
              {healthData.anomalies.map((anomaly, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    anomaly.severity === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    anomaly.severity === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                      anomaly.severity === 'High' ? 'text-red-500' :
                      anomaly.severity === 'Medium' ? 'text-yellow-500' :
                      'text-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">{anomaly.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{anomaly.field}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">AI Recommendations</h2>
            <div className="space-y-4">
              {healthData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'High' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' :
                    rec.priority === 'Medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' :
                    'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <CheckCircle className={`w-5 h-5 mt-1 flex-shrink-0 ${
                      rec.priority === 'High' ? 'text-red-500' :
                      rec.priority === 'Medium' ? 'text-yellow-500' :
                      'text-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-gray-900 dark:text-white font-medium">{rec.message}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{rec.type} • {rec.priority} Priority</p>
                    </div>
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
            {healthData.alerts.map((alert, index) => (
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

export default HealthMonitor;

