import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import { 
  getPreferences, 
  updatePreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  getLoginHistory,
  changePassword,
  sendTestNotification
} from '../services/settingsService';
import Toast from './Toast';
import HomeButton from './HomeButton';
import PageHeader from './PageHeader';
import Section from './Section';

export default function AdvancedSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  // Settings data
  const [preferences, setPreferences] = useState(null);
  const [notifications, setNotifications] = useState(null);
  const [loginHistory, setLoginHistory] = useState([]);
  
  // Form states
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    setLoading(true);
    try {
      const [prefsData, notifsData, loginData] = await Promise.all([
        getPreferences(),
        getNotificationPreferences(),
        getLoginHistory()
      ]);
      
      setPreferences(prefsData.preferences);
      setNotifications(notifsData.notifications);
      setLoginHistory(loginData.loginHistory);
    } catch (error) {
      console.error('Error loading settings:', error);
      setToast({ type: 'error', message: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      await updatePreferences(preferences);
      setToast({ type: 'success', message: 'Preferences updated successfully' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update preferences' });
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationsUpdate = async () => {
    setLoading(true);
    try {
      await updateNotificationPreferences(notifications);
      setToast({ type: 'success', message: 'Notification preferences updated successfully' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to update notifications' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setToast({ type: 'error', message: 'New passwords do not match' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setToast({ type: 'error', message: 'New password must be at least 6 characters' });
      return;
    }
    
    setLoading(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setToast({ type: 'success', message: 'Password changed successfully' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotification = async (type, method) => {
    try {
      await sendTestNotification(type, method);
      setToast({ type: 'success', message: `Test ${method.toUpperCase()} notification sent!` });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Failed to send test notification' });
    }
  };

  const tabs = [
    { id: 'preferences', label: 'Preferences', icon: '⚙️' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' }
  ];

  const renderPreferences = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">General Preferences</h3>
        {preferences && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={preferences.language}
                onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="kn">Kannada</option>
                <option value="te">Telugu</option>
                <option value="ta">Tamil</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme</label>
              <select
                value={preferences.theme}
                onChange={(e) => setPreferences(prev => ({ ...prev, theme: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={preferences.timezone}
                onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="UTC">UTC</option>
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Temperature Unit</label>
              <select
                value={preferences.temperatureUnit}
                onChange={(e) => setPreferences(prev => ({ ...prev, temperatureUnit: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="celsius">Celsius (°C)</option>
                <option value="fahrenheit">Fahrenheit (°F)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Measurement Unit</label>
              <select
                value={preferences.measurementUnit}
                onChange={(e) => setPreferences(prev => ({ ...prev, measurementUnit: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
              >
                <option value="metric">Metric (kg, km)</option>
                <option value="imperial">Imperial (lbs, miles)</option>
              </select>
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handlePreferencesUpdate}
            className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Preferences'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-blue-100 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Email Notifications</h3>
        {notifications && (
          <div className="space-y-4">
            {Object.entries(notifications.email || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-xs text-gray-500">
                    {key === 'weather' && 'Weather alerts and forecasts'}
                    {key === 'soil' && 'Soil analysis and recommendations'}
                    {key === 'growth' && 'Growth calendar reminders'}
                    {key === 'reports' && 'Weekly and monthly reports'}
                    {key === 'orders' && 'Order updates and confirmations'}
                    {key === 'payments' && 'Payment confirmations and receipts'}
                    {key === 'marketplace' && 'Marketplace updates and offers'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      email: { ...prev.email, [key]: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">SMS Notifications</h3>
        {notifications && (
          <div className="space-y-4">
            {Object.entries(notifications.sms || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-xs text-gray-500">
                    {key === 'weather' && 'Critical weather alerts'}
                    {key === 'soil' && 'Important soil updates'}
                    {key === 'growth' && 'Growth milestone alerts'}
                    {key === 'reports' && 'Summary reports'}
                    {key === 'orders' && 'Order status updates'}
                    {key === 'payments' && 'Payment confirmations'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      sms: { ...prev.sms, [key]: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Push Notifications</h3>
        {notifications && (
          <div className="space-y-4">
            {Object.entries(notifications.push || {}).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  <p className="text-xs text-gray-500">
                    {key === 'orders' && 'Real-time order updates'}
                    {key === 'payments' && 'Payment notifications'}
                    {key === 'marketplace' && 'Marketplace activities'}
                    {key === 'chat' && 'Chat messages and responses'}
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications(prev => ({
                      ...prev,
                      push: { ...prev.push, [key]: e.target.checked }
                    }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Test Notifications */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-yellow-100 shadow-[0_25px_60px_-15px_rgba(245,158,11,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Test Notifications</h3>
        <p className="text-gray-600 mb-4">Send test notifications to verify your settings are working correctly.</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['weather', 'soil', 'growth', 'reports'].map((type) => (
            <div key={type} className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 capitalize">{type}</h4>
              <div className="space-y-1">
                <button
                  onClick={() => handleTestNotification(type, 'email')}
                  className="w-full px-3 py-2 text-xs bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  Test Email
                </button>
                <button
                  onClick={() => handleTestNotification(type, 'sms')}
                  className="w-full px-3 py-2 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  Test SMS
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNotificationsUpdate}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          disabled={loading}
        >
          {loading ? 'Updating...' : 'Update Notifications'}
        </button>
      </div>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-red-100 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Change Password</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
              disabled={loading}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
              disabled={loading}
              required
              minLength={6}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
              className="w-full px-4 py-3 rounded-xl bg-white/90 border-2 border-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-400/30"
              disabled={loading}
              required
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-gray-100 shadow-[0_25px_60px_-15px_rgba(107,114,128,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Login History</h3>
        <div className="space-y-3">
          {loginHistory.slice(0, 10).map((login, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div>
                <p className="text-sm font-medium text-gray-800">{login.device}</p>
                <p className="text-xs text-gray-600">{login.location} • {login.ip}</p>
              </div>
              <p className="text-xs text-gray-500">{new Date(login.timestamp).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-6">
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-purple-100 shadow-[0_25px_60px_-15px_rgba(147,51,234,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Data Privacy</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Profile Visibility</p>
              <p className="text-xs text-gray-600">Control who can see your profile information</p>
            </div>
            <select className="px-3 py-2 rounded-lg border border-gray-300">
              <option value="public">Public</option>
              <option value="friends">Friends Only</option>
              <option value="private">Private</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Activity Sharing</p>
              <p className="text-xs text-gray-600">Share your farming activities with the community</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">Data Analytics</p>
              <p className="text-xs text-gray-600">Allow anonymous data collection for improving services</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-red-100 shadow-[0_25px_60px_-15px_rgba(239,68,68,0.18)]">
        <h3 className="text-xl font-bold text-gray-800 mb-4">Account Actions</h3>
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <h4 className="font-medium text-yellow-800 mb-2">Export Data</h4>
            <p className="text-sm text-yellow-700 mb-3">Download all your data in a portable format</p>
            <button className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
              Export My Data
            </button>
          </div>
          
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <h4 className="font-medium text-red-800 mb-2">Delete Account</h4>
            <p className="text-sm text-red-700 mb-3">Permanently delete your account and all associated data</p>
            <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences': return renderPreferences();
      case 'notifications': return renderNotifications();
      case 'security': return renderSecurity();
      case 'privacy': return renderPrivacy();
      default: return renderPreferences();
    }
  };

  if (loading && !preferences) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <HomeButton />
      <PageHeader
        title="Advanced Settings"
        subtitle="Customize your experience with comprehensive settings and preferences"
        icon="⚙️"
      />

      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="flex flex-wrap gap-2 bg-white/90 backdrop-blur-xl p-2 rounded-2xl border-2 border-green-100 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl transition-all ${
                activeTab === tab.id
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Section>
        {renderTabContent()}
      </Section>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}
