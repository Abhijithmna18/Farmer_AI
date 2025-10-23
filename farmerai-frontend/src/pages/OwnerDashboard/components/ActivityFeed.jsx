import React, { useState, useEffect } from 'react';

export default function ActivityFeed() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      // Mock activities for now - in real app, this would come from API
      const mockActivities = [
        {
          id: 1,
          type: 'booking',
          title: 'New booking created',
          description: 'Wheat storage booking for 30 days',
          user: 'John Doe',
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          amount: 15000
        },
        {
          id: 2,
          type: 'payment',
          title: 'Payment received',
          description: 'Payment processed for booking #BK001',
          user: 'System',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          amount: 15000
        },
        {
          id: 3,
          type: 'warehouse',
          title: 'Warehouse updated',
          description: 'Cold Storage Unit A capacity increased',
          user: 'Admin',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          amount: null
        },
        {
          id: 4,
          type: 'booking',
          title: 'Booking approved',
          description: 'Rice storage booking approved',
          user: 'System',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          amount: 8500
        },
        {
          id: 5,
          type: 'maintenance',
          title: 'Maintenance scheduled',
          description: 'Temperature control system inspection',
          user: 'Maintenance Team',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          amount: null
        }
      ];
      setActivities(mockActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking': return '📦';
      case 'payment': return '💰';
      case 'warehouse': return '🏪';
      case 'maintenance': return '🔧';
      case 'user': return '👤';
      default: return '📢';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking': return 'text-blue-600 bg-blue-100';
      case 'payment': return 'text-green-600 bg-green-100';
      case 'warehouse': return 'text-purple-600 bg-purple-100';
      case 'maintenance': return 'text-orange-600 bg-orange-100';
      case 'user': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Activity</h2>
        <button className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">📊</div>
            <p>No recent activity</p>
          </div>
        ) : (
          activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900">{activity.title}</h3>
                  <span className="text-xs text-gray-500">{formatTimeAgo(activity.timestamp)}</span>
                </div>
                <p className="text-sm text-gray-700 mt-1">{activity.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-500">by {activity.user}</span>
                  {activity.amount && (
                    <span className="text-sm font-medium text-emerald-600">
                      ₹{activity.amount.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



