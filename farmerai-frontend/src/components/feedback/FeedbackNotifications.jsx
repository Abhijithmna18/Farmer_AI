// src/components/feedback/FeedbackNotifications.jsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  Calendar,
  User,
  Trash2,
  CheckCircle2
} from 'lucide-react';

const FeedbackNotifications = ({ notifications, onClose, onMarkAsRead }) => {
  const getNotificationIcon = (type) => {
    const icons = {
      'status_update': CheckCircle,
      'response_received': MessageSquare,
      'bug_fixed': Bug,
      'feature_implemented': Lightbulb,
      'priority_change': AlertCircle,
      'assignment': User,
      'reminder': Clock
    };
    return icons[type] || Bell;
  };

  const getNotificationColor = (type) => {
    const colors = {
      'status_update': 'text-green-600 bg-green-100',
      'response_received': 'text-blue-600 bg-blue-100',
      'bug_fixed': 'text-red-600 bg-red-100',
      'feature_implemented': 'text-yellow-600 bg-yellow-100',
      'priority_change': 'text-orange-600 bg-orange-100',
      'assignment': 'text-purple-600 bg-purple-100',
      'reminder': 'text-gray-600 bg-gray-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Notifications</h2>
                  <p className="text-green-100 text-sm">
                    {unreadCount} unread • {notifications.length} total
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {notifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No Notifications</h3>
                <p className="text-gray-500">You're all caught up! New notifications will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification, index) => {
                  const Icon = getNotificationIcon(notification.type);
                  const isUnread = !notification.read;
                  
                  return (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        isUnread 
                          ? 'border-green-200 bg-green-50 shadow-md' 
                          : 'border-gray-100 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`font-semibold ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {notification.title}
                              </h4>
                              <p className={`text-sm mt-1 ${isUnread ? 'text-gray-700' : 'text-gray-600'}`}>
                                {notification.message}
                              </p>
                              
                              {notification.feedbackSubject && (
                                <div className="mt-2 p-2 bg-white rounded-lg border border-gray-200">
                                  <p className="text-xs text-gray-500 mb-1">Related Feedback:</p>
                                  <p className="text-sm font-medium text-gray-800">{notification.feedbackSubject}</p>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-4 mt-3 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(notification.createdAt)}</span>
                                </div>
                                {notification.priority && (
                                  <div className="flex items-center space-x-1">
                                    <Star className="w-3 h-3" />
                                    <span className="capitalize">{notification.priority} Priority</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-2 ml-4">
                              {isUnread && (
                                <button
                                  onClick={() => onMarkAsRead(notification.id)}
                                  className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                                title="Delete notification"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    Mark All Read
                  </button>
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    Clear All
                  </button>
                </div>
                <div className="flex items-center space-x-3">
                  <button className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    Settings
                  </button>
                  <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm">
                    Refresh
                  </button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default FeedbackNotifications;
