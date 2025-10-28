// src/components/feedback/FeedbackAnalytics.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  Users,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';

const FeedbackAnalytics = ({ analytics, loading }) => {
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border-2 border-gray-100 p-6 animate-pulse">
              <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
              <div className="h-8 w-16 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-24 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-600 mb-2">No Analytics Data</h3>
        <p className="text-gray-500">Analytics will appear once you have submitted feedback</p>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'Received': 'text-yellow-600 bg-yellow-100',
      'In Progress': 'text-blue-600 bg-blue-100',
      'Completed': 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getTypeColor = (type) => {
    const colors = {
      'Bug Report': 'text-red-600 bg-red-100',
      'Feature Suggestion': 'text-yellow-600 bg-yellow-100',
      'General Comment': 'text-blue-600 bg-blue-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-gray-600 bg-gray-100',
      'Medium': 'text-yellow-600 bg-yellow-100',
      'High': 'text-orange-600 bg-orange-100',
      'Critical': 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-500 rounded-xl">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {analytics.totalFeedback || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-blue-800 mb-1">Total Feedback</h3>
          <p className="text-sm text-blue-600">All time submissions</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-500 rounded-xl">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {analytics.completedFeedback || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-1">Completed</h3>
          <p className="text-sm text-green-600">Resolved feedback</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-yellow-500 rounded-xl">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-yellow-600">
              {analytics.avgResponseTime || 0}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-yellow-800 mb-1">Avg Response</h3>
          <p className="text-sm text-yellow-600">Days to respond</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-500 rounded-xl">
              <Star className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {analytics.satisfactionRate || 0}%
            </span>
          </div>
          <h3 className="text-lg font-semibold text-purple-800 mb-1">Satisfaction</h3>
          <p className="text-sm text-purple-600">User satisfaction rate</p>
        </motion.div>
      </div>

      {/* Charts and Detailed Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Status Distribution</h3>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.statusDistribution?.map((item, index) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                    {item.status === 'Received' && <Clock className="w-4 h-4" />}
                    {item.status === 'In Progress' && <AlertCircle className="w-4 h-4" />}
                    {item.status === 'Completed' && <CheckCircle className="w-4 h-4" />}
                  </div>
                  <span className="font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.status === 'Received' ? 'bg-yellow-500' :
                        item.status === 'In Progress' ? 'bg-blue-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${(item.count / analytics.totalFeedback) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl border-2 border-gray-100 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">Type Distribution</h3>
            <MessageSquare className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {analytics.typeDistribution?.map((item, index) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                    {item.type === 'Bug Report' && <Bug className="w-4 h-4" />}
                    {item.type === 'Feature Suggestion' && <Lightbulb className="w-4 h-4" />}
                    {item.type === 'General Comment' && <MessageSquare className="w-4 h-4" />}
                  </div>
                  <span className="font-medium text-gray-700">{item.type}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        item.type === 'Bug Report' ? 'bg-red-500' :
                        item.type === 'Feature Suggestion' ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}
                      style={{ width: `${(item.count / analytics.totalFeedback) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-2xl border-2 border-gray-100 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Recent Activity</h3>
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <RefreshCw className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          {analytics.recentActivity?.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className={`p-2 rounded-lg ${getStatusColor(activity.status)}`}>
                {activity.status === 'Received' && <Clock className="w-4 h-4" />}
                {activity.status === 'In Progress' && <AlertCircle className="w-4 h-4" />}
                {activity.status === 'Completed' && <CheckCircle className="w-4 h-4" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-800">{activity.subject}</p>
                <p className="text-sm text-gray-600">{activity.description}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{activity.status}</p>
                <p className="text-xs text-gray-500">{activity.date}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Export and Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex items-center justify-between bg-white rounded-2xl border-2 border-gray-100 p-6"
      >
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-1">Export Analytics</h3>
          <p className="text-sm text-gray-600">Download your feedback analytics data</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            CSV
          </button>
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            PDF
          </button>
          <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default FeedbackAnalytics;
