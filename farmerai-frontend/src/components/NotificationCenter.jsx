import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, X, Cloud, Droplets, Calendar } from 'lucide-react';

const mockNotifications = [
  {
    id: 1,
    type: 'weather',
    title: 'Rain Alert',
    message: 'Heavy rain expected in 2 hours. Consider covering sensitive crops.',
    time: '2 hours ago',
    read: false,
    priority: 'high',
    icon: Cloud
  },
  {
    id: 2,
    type: 'growth',
    title: 'Growth Stage Update',
    message: 'Your tomatoes are ready for the flowering stage. Apply fertilizer now.',
    time: '4 hours ago',
    read: false,
    priority: 'medium',
    icon: Calendar
  },
  {
    id: 3,
    type: 'soil',
    title: 'Soil Analysis Complete',
    message: 'Your soil pH is optimal at 6.8. No adjustments needed.',
    time: '1 day ago',
    read: true,
    priority: 'low',
    icon: CheckCircle
  },
  {
    id: 4,
    type: 'system',
    title: 'System Update',
    message: 'New features available! Check out the enhanced weather forecasting.',
    time: '2 days ago',
    read: true,
    priority: 'low',
    icon: Info
  }
];

export default function NotificationCenter({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState(mockNotifications);
  const [filter, setFilter] = useState('all');

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-green-600 dark:text-green-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high': return AlertTriangle;
      case 'medium': return Info;
      case 'low': return CheckCircle;
      default: return Info;
    }
  };

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const filteredNotifications = notifications.filter(notif => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notif.read;
    return notif.type === filter;
  });

  const unreadCount = notifications.filter(notif => !notif.read).length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-out">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Notifications
              </h2>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex gap-2">
              {[
                { key: 'all', label: 'All' },
                { key: 'unread', label: 'Unread' },
                { key: 'weather', label: 'Weather' },
                { key: 'growth', label: 'Growth' },
                { key: 'soil', label: 'Soil' }
              ].map(filterOption => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    filter === filterOption.key
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                  }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="mt-2 text-sm text-green-600 dark:text-green-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mb-4 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredNotifications.map(notification => {
                  const IconComponent = notification.icon;
                  const PriorityIcon = getPriorityIcon(notification.priority);
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-lg border transition-all ${
                        notification.read
                          ? 'bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600'
                          : 'bg-white dark:bg-slate-800 border-green-200 dark:border-green-700 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${
                          notification.read 
                            ? 'bg-gray-100 dark:bg-slate-600' 
                            : 'bg-green-100 dark:bg-green-900/20'
                        }`}>
                          <IconComponent className={`w-4 h-4 ${
                            notification.read 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-green-600 dark:text-green-400'
                          }`} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-medium ${
                              notification.read 
                                ? 'text-gray-600 dark:text-gray-400' 
                                : 'text-gray-800 dark:text-gray-200'
                            }`}>
                              {notification.title}
                            </h3>
                            <PriorityIcon className={`w-3 h-3 ${getPriorityColor(notification.priority)}`} />
                          </div>
                          <p className={`text-sm ${
                            notification.read 
                              ? 'text-gray-500 dark:text-gray-400' 
                              : 'text-gray-600 dark:text-gray-300'
                          }`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => markAsRead(notification.id)}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4 text-gray-400 hover:text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteNotification(notification.id)}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded transition-colors"
                            title="Delete"
                          >
                            <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}








