import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Smartphone, Save, Send } from 'lucide-react';
import { getNotificationPreferences, updateNotificationPreferences, sendTestNotification } from '../../services/settingsService';

export default function NotificationsSection({ loading, setLoading, showToast }) {
  const [notifications, setNotifications] = useState({
    email: {
      weather: true,
      soil: true,
      growth: true,
      reports: false
    },
    sms: {
      weather: false,
      soil: false,
      growth: true,
      reports: false
    }
  });

  useEffect(() => {
    const loadNotificationPreferences = async () => {
      try {
        const response = await getNotificationPreferences();
        setNotifications(response.notifications);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };
    
    loadNotificationPreferences();
  }, []);

  const handleNotificationUpdate = async () => {
    setLoading(true);
    try {
      const response = await updateNotificationPreferences(notifications);
      setNotifications(response.notifications);
      showToast('Notification preferences saved!', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save notification preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (type, method) => {
    setLoading(true);
    try {
      await sendTestNotification(type, method);
      showToast(`Test ${method.toUpperCase()} notification sent!`, 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || `Failed to send test ${method.toUpperCase()} notification.`, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Notification Preferences</h2>
      
      <div className="space-y-6">
        {/* Email Notifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(notifications.email).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                    {key === 'weather' ? 'Weather Alerts' : 
                     key === 'soil' ? 'Soil Analysis' :
                     key === 'growth' ? 'Growth Reminders' : 'Reports'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {key === 'weather' ? 'Get notified about weather changes' :
                     key === 'soil' ? 'Receive soil analysis results' :
                     key === 'growth' ? 'Growth stage reminders' : 'Weekly reports'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      email: { ...notifications.email, [key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleTestNotification('weather', 'email')}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Test Email
          </button>
        </div>

        {/* SMS Notifications */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            SMS Notifications
          </h3>
          <div className="space-y-4">
            {Object.entries(notifications.sms).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-800 dark:text-gray-200 capitalize">
                    {key === 'weather' ? 'Weather Alerts' : 
                     key === 'soil' ? 'Soil Analysis' :
                     key === 'growth' ? 'Growth Reminders' : 'Reports'}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {key === 'weather' ? 'Get SMS about weather changes' :
                     key === 'soil' ? 'Receive soil analysis via SMS' :
                     key === 'growth' ? 'Growth stage SMS reminders' : 'Weekly SMS reports'}
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications({
                      ...notifications,
                      sms: { ...notifications.sms, [key]: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}
          </div>
          <button
            onClick={() => handleTestNotification('weather', 'sms')}
            disabled={loading}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send Test SMS
          </button>
        </div>

        <button
          onClick={handleNotificationUpdate}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Notification Preferences'}
        </button>
      </div>
    </motion.div>
  );
}
