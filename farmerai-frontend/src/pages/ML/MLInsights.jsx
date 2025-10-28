import React, { useState, useEffect } from 'react';
import { Brain, TrendingUp, AlertTriangle, CheckCircle, Target, Leaf, Droplets, Shield } from 'lucide-react';

const MLInsights = () => {
  const [insights, setInsights] = useState({
    yieldPredictions: 0,
    fertilizerRecommendations: 0,
    irrigationOptimizations: 0,
    healthScores: 0,
    priceForecasts: 0,
    alerts: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading ML insights data
    setTimeout(() => {
      setInsights({
        yieldPredictions: 12,
        fertilizerRecommendations: 8,
        irrigationOptimizations: 15,
        healthScores: 7,
        priceForecasts: 5,
        alerts: [
          { type: 'warning', message: 'Low yield prediction for Field A - consider fertilizer adjustment', timestamp: '2 hours ago' },
          { type: 'info', message: 'Irrigation schedule optimized for Field B', timestamp: '4 hours ago' },
          { type: 'success', message: 'Fertilizer recommendation applied successfully in Field C', timestamp: '1 day ago' }
        ]
      });
      setLoading(false);
    }, 1000);
  }, []);

  const mlFeatures = [
    {
      title: 'Yield Prediction',
      icon: Target,
      count: insights.yieldPredictions,
      description: 'AI-powered crop yield prediction using ANN regression',
      color: 'bg-green-500',
      href: '/ml/yield'
    },
    {
      title: 'Fertilizer Recommendation',
      icon: Leaf,
      count: insights.fertilizerRecommendations,
      description: 'Smart fertilizer recommendations using decision tree classification',
      color: 'bg-blue-500',
      href: '/ml/fertilizer'
    },
    {
      title: 'Irrigation AI',
      icon: Droplets,
      count: insights.irrigationOptimizations,
      description: 'Smart water management optimization',
      color: 'bg-blue-500',
      href: '/ml/irrigation'
    },
    {
      title: 'Health Monitor',
      icon: Shield,
      count: insights.healthScores,
      description: 'Crop health monitoring and analysis',
      color: 'bg-green-500',
      href: '/ml/health'
    },
    {
      title: 'Price Prediction',
      icon: TrendingUp,
      count: insights.priceForecasts,
      description: 'Market price forecasting and trends',
      color: 'bg-purple-500',
      href: '/ml/pricing'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-white dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Insights Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive overview of your farm's AI-powered analytics and recommendations
          </p>
        </div>

        {/* ML Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {mlFeatures.map((feature, index) => (
            <div
              key={index}
              className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-slate-700"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${feature.color} bg-opacity-10`}>
                  <feature.icon className={`w-6 h-6 ${feature.color.replace('bg-', 'text-')}`} />
                </div>
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{feature.count}</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{feature.description}</p>
              <a
                href={feature.href}
                className="inline-flex items-center text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View Details →
              </a>
            </div>
          ))}
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-slate-700">
          <div className="flex items-center gap-3 mb-6">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent AI Alerts</h2>
          </div>
          <div className="space-y-4">
            {insights.alerts.map((alert, index) => (
              <div
                key={index}
                className={`flex items-start gap-3 p-4 rounded-lg border ${
                  alert.type === 'warning'
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : alert.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                    : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                }`}
              >
                <div className="flex-shrink-0 mt-1">
                  {alert.type === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  ) : alert.type === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Brain className="w-5 h-5 text-blue-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium">{alert.message}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{alert.timestamp}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MLInsights;

