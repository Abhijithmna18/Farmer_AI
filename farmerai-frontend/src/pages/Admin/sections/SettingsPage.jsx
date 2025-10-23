import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Palette, Shield, Bell, Globe, Building, CreditCard, 
  Mail, Phone, Server, Key, Database, History, Lock, 
  Sun, Moon, Monitor, Save, Eye, EyeOff
} from 'lucide-react';
import useAuth from '../../../hooks/useAuth';
import Toast from '../../../components/Toast';
import * as adminSettingsService from '../../../services/adminSettingsService';

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('preferences');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
  useEffect(() => {
    const adminRoles = user && (user.role === 'admin' || (Array.isArray(user.roles) && user.roles.includes('admin')));
    setIsAdmin(adminRoles);
  }, [user]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 5000);
  };

  // Admin Preferences State
  const [preferences, setPreferences] = useState({
    profile: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      photoURL: user?.photoURL || ''
    },
    interface: {
      theme: 'light',
      layout: 'full',
      landingPage: 'overview'
    },
    notifications: {
      email: true,
      sms: false,
      inApp: true,
      categories: {
        approvals: true,
        payments: true,
        userActivities: true
      }
    },
    language: 'en',
    timezone: 'UTC'
  });

  // System Configuration State
  const [systemConfig, setSystemConfig] = useState({
    general: {
      systemName: 'FarmerAI',
      logo: '',
      primaryColor: '#10B981',
      secondaryColor: '#059669',
      currency: 'INR',
      measurementUnit: 'metric'
    },
    warehouse: {
      defaultDuration: 30,
      cancellationPolicy: '24h',
      autoApproval: false
    },
    payment: {
      gateway: 'razorpay',
      mode: 'test',
      apiKey: '',
      autoRefund: false
    },
    communication: {
      emailSender: 'noreply@farmerai.com',
      smtpHost: 'smtp.gmail.com',
      smtpPort: 587,
      smsGateway: '',
      whatsappGateway: ''
    }
  });

  // Environment Configuration State
  const [envConfig, setEnvConfig] = useState({
    database: {
      MONGO_URI: 'mongodb://localhost:27017/farmerai'
    },
    api: {
      PORT: '5000',
      JWT_SECRET: '********',
      CORS_ORIGIN: 'http://localhost:5173'
    },
    services: {
      GEMINI_API_KEY: '********',
      EMAIL_USER: '********',
      EMAIL_PASS: '********',
      RAZORPAY_KEY_ID: '********',
      RAZORPAY_KEY_SECRET: '********'
    }
  });

  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [superAdminPassword, setSuperAdminPassword] = useState('');

  // Security & Access Control State
  const [accessLogs, setAccessLogs] = useState([]);

  // Load data when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load admin preferences
        const preferencesData = await adminSettingsService.getAdminPreferences();
        if (preferencesData.success) {
          setPreferences(preferencesData.data);
        }

        // Load system configuration
        const systemConfigData = await adminSettingsService.getSystemConfiguration();
        if (systemConfigData.success) {
          setSystemConfig(systemConfigData.data);
        }

        // Load environment configuration
        const envConfigData = await adminSettingsService.getEnvironmentConfiguration();
        if (envConfigData.success) {
          setEnvConfig(envConfigData.data);
        }

        // Load configuration logs
        const logsData = await adminSettingsService.getConfigurationLogs();
        if (logsData.success) {
          setAccessLogs(logsData.data);
        }
      } catch (error) {
        console.error('Error loading settings data:', error);
        showToast('Failed to load settings data.', 'error');
      }
    };

    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const tabs = [
    { id: 'preferences', label: 'Admin Preferences', icon: User, adminOnly: false },
    { id: 'system', label: 'System Configuration', icon: Server, adminOnly: true },
    { id: 'environment', label: 'Environment Config', icon: Database, adminOnly: true },
    { id: 'security', label: 'Security & Access', icon: Shield, adminOnly: true }
  ];

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const response = await adminSettingsService.updateAdminPreferences(preferences);
      if (response.success) {
        showToast('Preferences saved successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to save preferences.', 'error');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showToast('Failed to save preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemConfig = async () => {
    setLoading(true);
    try {
      const response = await adminSettingsService.updateSystemConfiguration(systemConfig);
      if (response.success) {
        showToast('System configuration saved successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to save system configuration.', 'error');
      }
    } catch (error) {
      console.error('Error saving system configuration:', error);
      showToast('Failed to save system configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnvConfig = async () => {
    setLoading(true);
    try {
      // In a real implementation, we would verify the super admin password here
      // For now, we'll just proceed with the update
      const configToUpdate = { ...envConfig };
      
      // Don't send masked values back to server
      if (configToUpdate.api.JWT_SECRET === '********') {
        delete configToUpdate.api.JWT_SECRET;
      }
      if (configToUpdate.services.EMAIL_PASS === '********') {
        delete configToUpdate.services.EMAIL_PASS;
      }
      if (configToUpdate.services.RAZORPAY_KEY_SECRET === '********') {
        delete configToUpdate.services.RAZORPAY_KEY_SECRET;
      }

      const response = await adminSettingsService.updateEnvironmentConfiguration(configToUpdate);
      if (response.success) {
        showToast('Environment configuration saved successfully!', 'success');
      } else {
        showToast(response.message || 'Failed to save environment configuration.', 'error');
      }
    } catch (error) {
      console.error('Error saving environment configuration:', error);
      showToast('Failed to save environment configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm('Are you sure you want to restore all configurations to their default values?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminSettingsService.restoreDefaultConfiguration();
      if (response.success) {
        showToast('Default configuration restored successfully!', 'success');
        // Reload the data to show the defaults
        const systemConfigData = await adminSettingsService.getSystemConfiguration();
        if (systemConfigData.success) {
          setSystemConfig(systemConfigData.data);
        }
      } else {
        showToast(response.message || 'Failed to restore default configuration.', 'error');
      }
    } catch (error) {
      console.error('Error restoring default configuration:', error);
      showToast('Failed to restore default configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Render Admin Preferences Section
  const renderPreferences = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Admin Preferences</h2>
      
      {/* Profile Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Profile Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              value={preferences.profile.name}
              onChange={(e) => setPreferences({
                ...preferences,
                profile: { ...preferences.profile, name: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={preferences.profile.email}
              onChange={(e) => setPreferences({
                ...preferences,
                profile: { ...preferences.profile, email: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={preferences.profile.phone}
              onChange={(e) => setPreferences({
                ...preferences,
                profile: { ...preferences.profile, phone: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Two-Factor Authentication
            </label>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Enabled</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      {/* Interface Preferences */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Interface Preferences</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Theme
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light', label: 'Light', icon: Sun },
                { value: 'dark', label: 'Dark', icon: Moon },
                { value: 'auto', label: 'Auto', icon: Monitor }
              ].map((theme) => {
                const IconComponent = theme.icon;
                return (
                  <button
                    key={theme.value}
                    onClick={() => setPreferences({
                      ...preferences,
                      interface: { ...preferences.interface, theme: theme.value }
                    })}
                    className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 ${
                      preferences.interface.theme === theme.value
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-300 dark:border-slate-600 hover:border-green-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span className="text-xs">{theme.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Dashboard Layout
            </label>
            <select
              value={preferences.interface.layout}
              onChange={(e) => setPreferences({
                ...preferences,
                interface: { ...preferences.interface, layout: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="compact">Compact</option>
              <option value="full">Full</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Landing Page
            </label>
            <select
              value={preferences.interface.landingPage}
              onChange={(e) => setPreferences({
                ...preferences,
                interface: { ...preferences.interface, landingPage: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="overview">Overview</option>
              <option value="bookings">Bookings</option>
              <option value="warehouses">Warehouses</option>
              <option value="analytics">Analytics</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Notification Preferences */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notification Preferences</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'email', label: 'Email Notifications' },
              { key: 'sms', label: 'SMS Notifications' },
              { key: 'inApp', label: 'In-App Notifications' }
            ].map((notif) => (
              <div key={notif.key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300">{notif.label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences.notifications[notif.key]}
                    onChange={(e) => setPreferences({
                      ...preferences,
                      notifications: {
                        ...preferences.notifications,
                        [notif.key]: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                </label>
              </div>
            ))}
          </div>
          
          <div>
            <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-2">Notification Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(preferences.notifications.categories).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
                  <span className="text-gray-700 dark:text-gray-300 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setPreferences({
                        ...preferences,
                        notifications: {
                          ...preferences.notifications,
                          categories: {
                            ...preferences.notifications.categories,
                            [key]: e.target.checked
                          }
                        }
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Language & Timezone */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Language & Timezone</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({
                ...preferences,
                language: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="en">English</option>
              <option value="hi">Hindi</option>
              <option value="ta">Tamil</option>
              <option value="te">Telugu</option>
              <option value="kn">Kannada</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Timezone
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({
                ...preferences,
                timezone: e.target.value
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="UTC">UTC</option>
              <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
              <option value="America/New_York">America/New_York (EST)</option>
              <option value="Europe/London">Europe/London (GMT)</option>
            </select>
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSavePreferences}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save Preferences'}
      </button>
    </motion.div>
  );

  // Render System Configuration Section
  const renderSystemConfig = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">System Configuration</h2>
      
      {/* General Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">General Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              System Name
            </label>
            <input
              type="text"
              value={systemConfig.general.systemName}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                general: { ...systemConfig.general, systemName: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Currency
            </label>
            <select
              value={systemConfig.general.currency}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                general: { ...systemConfig.general, currency: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="INR">INR (₹)</option>
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Measurement Unit
            </label>
            <select
              value={systemConfig.general.measurementUnit}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                general: { ...systemConfig.general, measurementUnit: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, ft)</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Warehouse & Booking Policies */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Building className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Warehouse & Booking Policies</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Default Booking Duration (days)
            </label>
            <input
              type="number"
              value={systemConfig.warehouse.defaultDuration}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                warehouse: { ...systemConfig.warehouse, defaultDuration: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cancellation Policy
            </label>
            <select
              value={systemConfig.warehouse.cancellationPolicy}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                warehouse: { ...systemConfig.warehouse, cancellationPolicy: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="24h">24 Hours</option>
              <option value="48h">48 Hours</option>
              <option value="72h">72 Hours</option>
              <option value="no">No Cancellations</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Auto-Approval for Warehouses</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.warehouse.autoApproval}
                onChange={(e) => setSystemConfig({
                  ...systemConfig,
                  warehouse: { ...systemConfig.warehouse, autoApproval: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Payment & Transaction Settings */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Payment & Transaction Settings</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Gateway
            </label>
            <select
              value={systemConfig.payment.gateway}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                payment: { ...systemConfig.payment, gateway: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="razorpay">Razorpay</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Mode
            </label>
            <select
              value={systemConfig.payment.mode}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                payment: { ...systemConfig.payment, mode: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            >
              <option value="test">Test</option>
              <option value="live">Live</option>
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              API Key
            </label>
            <input
              type="text"
              value={systemConfig.payment.apiKey}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                payment: { ...systemConfig.payment, apiKey: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <span className="text-gray-700 dark:text-gray-300">Auto-Refund Policy</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={systemConfig.payment.autoRefund}
                onChange={(e) => setSystemConfig({
                  ...systemConfig,
                  payment: { ...systemConfig.payment, autoRefund: e.target.checked }
                })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>
      
      {/* Notification & Communication */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Notification & Communication</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Sender Address
            </label>
            <input
              type="email"
              value={systemConfig.communication.emailSender}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                communication: { ...systemConfig.communication, emailSender: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Host
            </label>
            <input
              type="text"
              value={systemConfig.communication.smtpHost}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                communication: { ...systemConfig.communication, smtpHost: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMTP Port
            </label>
            <input
              type="number"
              value={systemConfig.communication.smtpPort}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                communication: { ...systemConfig.communication, smtpPort: parseInt(e.target.value) }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              SMS Gateway
            </label>
            <input
              type="text"
              value={systemConfig.communication.smsGateway}
              onChange={(e) => setSystemConfig({
                ...systemConfig,
                communication: { ...systemConfig.communication, smsGateway: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      <button
        onClick={handleSaveSystemConfig}
        disabled={loading}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save System Configuration'}
      </button>
    </motion.div>
  );

  // Render Environment Configuration Section
  const renderEnvironmentConfig = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Environment Configuration</h2>
      
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-2">
          <Shield className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
          <div>
            <h3 className="font-medium text-yellow-800 dark:text-yellow-200">Security Notice</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Environment variables require server restart to take effect. Only Super Admins can modify these settings.
            </p>
          </div>
        </div>
      </div>
      
      {/* Database Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Database Configuration</h3>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              MongoDB URI
            </label>
            <div className="relative">
              <input
                type={showSensitiveData ? "text" : "password"}
                value={envConfig.database.MONGO_URI}
                onChange={(e) => setEnvConfig({
                  ...envConfig,
                  database: { ...envConfig.database, MONGO_URI: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white pr-12"
              />
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* API Configuration */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">API Configuration</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Port
            </label>
            <input
              type="text"
              value={envConfig.api.PORT}
              onChange={(e) => setEnvConfig({
                ...envConfig,
                api: { ...envConfig.api, PORT: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              JWT Secret
            </label>
            <div className="relative">
              <input
                type={showSensitiveData ? "text" : "password"}
                value={envConfig.api.JWT_SECRET}
                onChange={(e) => setEnvConfig({
                  ...envConfig,
                  api: { ...envConfig.api, JWT_SECRET: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white pr-12"
              />
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              CORS Origin
            </label>
            <input
              type="text"
              value={envConfig.api.CORS_ORIGIN}
              onChange={(e) => setEnvConfig({
                ...envConfig,
                api: { ...envConfig.api, CORS_ORIGIN: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
        </div>
      </div>
      
      {/* Service Keys */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Key className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Service Keys</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gemini API Key
            </label>
            <div className="relative">
              <input
                type={showSensitiveData ? "text" : "password"}
                value={envConfig.services.GEMINI_API_KEY}
                onChange={(e) => setEnvConfig({
                  ...envConfig,
                  services: { ...envConfig.services, GEMINI_API_KEY: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white pr-12"
              />
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email User
            </label>
            <input
              type="text"
              value={envConfig.services.EMAIL_USER}
              onChange={(e) => setEnvConfig({
                ...envConfig,
                services: { ...envConfig.services, EMAIL_USER: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Password
            </label>
            <div className="relative">
              <input
                type={showSensitiveData ? "text" : "password"}
                value={envConfig.services.EMAIL_PASS}
                onChange={(e) => setEnvConfig({
                  ...envConfig,
                  services: { ...envConfig.services, EMAIL_PASS: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white pr-12"
              />
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Razorpay Key ID
            </label>
            <input
              type="text"
              value={envConfig.services.RAZORPAY_KEY_ID}
              onChange={(e) => setEnvConfig({
                ...envConfig,
                services: { ...envConfig.services, RAZORPAY_KEY_ID: e.target.value }
              })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            />
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Razorpay Key Secret
            </label>
            <div className="relative">
              <input
                type={showSensitiveData ? "text" : "password"}
                value={envConfig.services.RAZORPAY_KEY_SECRET}
                onChange={(e) => setEnvConfig({
                  ...envConfig,
                  services: { ...envConfig.services, RAZORPAY_KEY_SECRET: e.target.value }
                })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white pr-12"
              />
              <button
                onClick={() => setShowSensitiveData(!showSensitiveData)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showSensitiveData ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Super Admin Verification */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Super Admin Verification</h3>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter your password to confirm changes
          </label>
          <input
            type="password"
            value={superAdminPassword}
            onChange={(e) => setSuperAdminPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
            placeholder="Enter your password"
          />
        </div>
      </div>
      
      <button
        onClick={handleSaveEnvConfig}
        disabled={loading || !superAdminPassword}
        className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
      >
        <Save className="w-4 h-4" />
        {loading ? 'Saving...' : 'Save Environment Configuration'}
      </button>
    </motion.div>
  );

  // Render Security & Access Control Section
  const renderSecurityAccess = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Security & Access Control</h2>
      
      {/* Access Logs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Configuration Change Logs</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
            <thead className="bg-gray-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Category</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
              {accessLogs.length > 0 ? (
                accessLogs.map((log, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      {log.user?.email || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.action.replace(/_/g, ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {log.category.replace(/_/g, ' ')}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    No configuration changes recorded yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Restore Defaults */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">System Management</h3>
        </div>
        
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">Restore Default Configuration</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-4">
            This will reset all system configurations to their default values. This action cannot be undone.
          </p>
          <button
            onClick={handleRestoreDefaults}
            disabled={loading}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Restoring...' : 'Restore Defaults'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences': return renderPreferences();
      case 'system': return renderSystemConfig();
      case 'environment': return renderEnvironmentConfig();
      case 'security': return renderSecurityAccess();
      default: return renderPreferences();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Settings</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your admin preferences, system configuration, and security settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.filter(tab => !tab.adminOnly || isAdmin).map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {renderTabContent()}
      </div>

      {/* Toast */}
      <Toast message={toast.message} type={toast.type} onDismiss={() => setToast({ message: '', type: 'info' })} />
    </div>
  );
}