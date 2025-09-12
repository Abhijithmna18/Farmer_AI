import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Droplets,
  Sun,
  Cloud,
  Wind,
  Thermometer,
  Target,
  PieChart,
  Activity
} from 'lucide-react';

const CalendarAnalytics = ({ calendarId, analytics, onRefresh }) => {
  const [timeRange, setTimeRange] = useState('season');
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await onRefresh(calendarId);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, trend, color = 'blue', subtitle }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-100 dark:bg-${color}-900/20`}>
          <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center">
          {trend > 0 ? (
            <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
          )}
          <span className={`text-sm font-medium ${trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Math.abs(trend)}% from last season
          </span>
        </div>
      )}
    </motion.div>
  );

  const ProgressBar = ({ label, value, max, color = 'blue' }) => (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm text-gray-500 dark:text-gray-400">{value}/{max}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(value / max) * 100}%` }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className={`h-2 rounded-full bg-${color}-500`}
        />
      </div>
    </div>
  );

  const WeatherCard = ({ title, value, icon: Icon, unit, color = 'blue' }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {value}{unit}
          </p>
        </div>
        <Icon className={`w-5 h-5 text-${color}-500`} />
      </div>
    </div>
  );

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">No analytics data available</p>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Generate Analytics'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Insights and performance metrics for your farming activities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="season">This Season</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Crops Sown"
          value={analytics.totalCropsSown || 0}
          icon={Calendar}
          color="green"
          subtitle="This season"
        />
        <StatCard
          title="Completion Rate"
          value={`${Math.round(analytics.completionRate || 0)}%`}
          icon={CheckCircle}
          color="blue"
          subtitle={`${analytics.completedTasks || 0} of ${analytics.totalTasks || 0} tasks`}
        />
        <StatCard
          title="Average Growth Duration"
          value={`${analytics.averageGrowthDuration || 0} days`}
          icon={TrendingUp}
          color="purple"
          subtitle="From planting to harvest"
        />
        <StatCard
          title="Missed Tasks"
          value={analytics.missedTasks || 0}
          icon={AlertTriangle}
          color="red"
          subtitle="Requires attention"
        />
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-500" />
            Task Completion Progress
          </h3>
          <ProgressBar
            label="Completed Tasks"
            value={analytics.completedTasks || 0}
            max={analytics.totalTasks || 1}
            color="green"
          />
          <ProgressBar
            label="Pending Tasks"
            value={(analytics.totalTasks || 0) - (analytics.completedTasks || 0) - (analytics.missedTasks || 0)}
            max={analytics.totalTasks || 1}
            color="yellow"
          />
          <ProgressBar
            label="Missed Tasks"
            value={analytics.missedTasks || 0}
            max={analytics.totalTasks || 1}
            color="red"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-500" />
            Yield Predictions
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Expected Yield</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {analytics.expectedYield || 'N/A'} kg
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Actual Yield</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {analytics.actualYield || 'Pending'} kg
              </span>
            </div>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Based on current progress and historical data, your expected yield is on track.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Activity Timeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-500" />
          Recent Activity
        </h3>
        <div className="space-y-3">
          {[
            { action: 'Sowing completed', time: '2 hours ago', type: 'success' },
            { action: 'Irrigation scheduled', time: '1 day ago', type: 'info' },
            { action: 'Fertilization reminder', time: '3 days ago', type: 'warning' },
            { action: 'Harvest window opening', time: '1 week ago', type: 'info' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'success' ? 'bg-green-500' :
                activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
              }`} />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.action}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Weather Impact */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Cloud className="w-5 h-5 text-blue-500" />
          Weather Impact Analysis
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <WeatherCard
            title="Average Temperature"
            value="24"
            icon={Thermometer}
            unit="°C"
            color="red"
          />
          <WeatherCard
            title="Rainfall"
            value="45"
            icon={Droplets}
            unit="mm"
            color="blue"
          />
          <WeatherCard
            title="Sunshine Hours"
            value="8.5"
            icon={Sun}
            unit="hrs"
            color="yellow"
          />
          <WeatherCard
            title="Wind Speed"
            value="12"
            icon={Wind}
            unit="km/h"
            color="gray"
          />
        </div>
        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h4 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
            Weather Recommendations
          </h4>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• Optimal conditions for current growth stage</li>
            <li>• Consider irrigation reduction due to recent rainfall</li>
            <li>• Monitor for potential pest activity with current humidity</li>
          </ul>
        </div>
      </motion.div>

      {/* Performance Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-100 dark:border-gray-700"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-purple-500" />
          Performance Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Strengths</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Consistent task completion rate
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Good weather adaptation
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Effective crop rotation
              </li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Areas for Improvement</h4>
            <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Reduce missed irrigation schedules
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Optimize fertilization timing
              </li>
              <li className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                Improve harvest planning
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CalendarAnalytics;


