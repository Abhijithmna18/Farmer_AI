import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';

export default function AlertsPanel() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      // Mock alerts for now - in real app, this would come from API
      const mockAlerts = [
        {
          id: 1,
          type: 'warning',
          title: 'Low Stock Alert',
          message: 'Warehouse A has only 20% capacity remaining',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          action: 'View Details'
        },
        {
          id: 2,
          type: 'info',
          title: 'New Booking Request',
          message: '3 new booking requests pending approval',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
          action: 'Review'
        },
        {
          id: 3,
          type: 'success',
          title: 'Payment Received',
          message: 'Payment of ₹15,000 received for booking #BK001',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
          action: 'View Invoice'
        },
        {
          id: 4,
          type: 'error',
          title: 'Maintenance Required',
          message: 'Temperature control system needs inspection',
          timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          action: 'Schedule'
        }
      ];
      setAlerts(mockAlerts);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'warning': return '⚠️';
      case 'error': return '❌';
      case 'success': return '✅';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'success': return 'border-green-200 bg-green-50';
      case 'info': return 'border-blue-200 bg-blue-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const diff = now - timestamp;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4">Alerts & Notifications</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Alerts & Notifications</h2>
        <span className="text-sm text-gray-500">{alerts.length} alerts</span>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🔔</div>
            <p>No alerts at the moment</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert.type)} hover:shadow-sm transition-shadow`}
            >
              <div className="flex items-start space-x-3">
                <div className="text-xl">{getAlertIcon(alert.type)}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{alert.title}</h3>
                    <span className="text-xs text-gray-500">{formatTimeAgo(alert.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
                  <button className="text-sm text-emerald-600 hover:text-emerald-700 mt-2 font-medium">
                    {alert.action} →
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}



