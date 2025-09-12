import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Globe, Palette, Clock, Ruler, Save } from 'lucide-react';
import { getPreferences, updatePreferences as updatePreferencesAPI } from '../../services/settingsService';
import { useTheme } from '../../context/ThemeContext';

export default function PreferencesSection({ loading, setLoading, showToast }) {
  const { theme, setThemeMode } = useTheme();
  const [preferences, setPreferences] = useState({
    language: 'en',
    theme: theme,
    timezone: 'UTC',
    temperatureUnit: 'celsius',
    measurementUnit: 'metric'
  });

  useEffect(() => {
    // Load user preferences from API
    const loadPreferences = async () => {
      try {
        const response = await getPreferences();
        setPreferences(response.preferences);
      } catch (error) {
        console.error('Failed to load preferences:', error);
        // Fallback to localStorage
        const savedPreferences = localStorage.getItem('userPreferences');
        if (savedPreferences) {
          setPreferences(JSON.parse(savedPreferences));
        }
      }
    };
    
    loadPreferences();
  }, []);

  const handlePreferencesUpdate = async () => {
    setLoading(true);
    try {
      const response = await updatePreferencesAPI(preferences);
      setPreferences(response.preferences);
      showToast('Preferences saved successfully!', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Failed to save preferences.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = async (newTheme) => {
    setPreferences({ ...preferences, theme: newTheme });
    // Update theme immediately in the context
    await setThemeMode(newTheme, false); // Don't show toast here, we'll show it on save
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">Preferences</h2>
      
      <div className="space-y-6">
        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Globe className="w-4 h-4 inline mr-2" />
            Language
          </label>
          <select
            value={preferences.language}
            onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="en">English</option>
            <option value="hi">Hindi (हिन्दी)</option>
            <option value="ta">Tamil (தமிழ்)</option>
            <option value="te">Telugu (తెలుగు)</option>
            <option value="bn">Bengali (বাংলা)</option>
          </select>
        </div>

        {/* Theme */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Palette className="w-4 h-4 inline mr-2" />
            Theme
          </label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { value: 'light', label: 'Light', icon: '☀️' },
              { value: 'dark', label: 'Dark', icon: '🌙' }
            ].map((themeOption) => (
              <motion.button
                key={themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  preferences.theme === themeOption.value
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-green-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={preferences.theme === themeOption.value}
                role="radio"
                aria-label={`${themeOption.label} theme`}
              >
                <motion.div 
                  className="text-2xl mb-2"
                  animate={{ 
                    rotate: themeOption.value === 'dark' ? 180 : 0,
                    scale: preferences.theme === themeOption.value ? 1.1 : 1
                  }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  {themeOption.icon}
                </motion.div>
                <div className="font-medium">{themeOption.label}</div>
                {preferences.theme === themeOption.value && (
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full mx-auto mt-2"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Timezone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <Clock className="w-4 h-4 inline mr-2" />
            Timezone
          </label>
          <select
            value={preferences.timezone}
            onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
            <option value="Europe/London">London (GMT)</option>
            <option value="Asia/Kolkata">India (IST)</option>
          </select>
        </div>

        {/* Units */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Ruler className="w-4 h-4 inline mr-2" />
              Temperature Unit
            </label>
            <div className="space-y-2">
              {[
                { value: 'celsius', label: 'Celsius (°C)' },
                { value: 'fahrenheit', label: 'Fahrenheit (°F)' }
              ].map((unit) => (
                <label key={unit.value} className="flex items-center">
                  <input
                    type="radio"
                    name="temperature"
                    value={unit.value}
                    checked={preferences.temperatureUnit === unit.value}
                    onChange={(e) => setPreferences({ ...preferences, temperatureUnit: e.target.value })}
                    className="mr-3"
                  />
                  {unit.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Ruler className="w-4 h-4 inline mr-2" />
              Measurement Unit
            </label>
            <div className="space-y-2">
              {[
                { value: 'metric', label: 'Metric (kg, cm)' },
                { value: 'imperial', label: 'Imperial (lb, ft)' }
              ].map((unit) => (
                <label key={unit.value} className="flex items-center">
                  <input
                    type="radio"
                    name="measurement"
                    value={unit.value}
                    checked={preferences.measurementUnit === unit.value}
                    onChange={(e) => setPreferences({ ...preferences, measurementUnit: e.target.value })}
                    className="mr-3"
                  />
                  {unit.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handlePreferencesUpdate}
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </motion.div>
  );
}
