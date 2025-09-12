import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Palette, CheckCircle } from 'lucide-react';

export default function ThemeDemo() {
  const { theme, isDark, toggleTheme, setThemeMode, getThemeIcon } = useTheme();

  const themeOptions = [
    { value: 'light', label: 'Light Mode', icon: Sun, description: 'Clean and bright interface' },
    { value: 'dark', label: 'Dark Mode', icon: Moon, description: 'Easy on the eyes in low light' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-gray-200 dark:border-slate-700"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
          <Palette className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">Theme Demo</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Experience the theme system</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Current Theme Display */}
        <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">
                Current Theme: {theme === 'dark' ? 'Dark' : 'Light'}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {isDark ? 'Perfect for low-light environments' : 'Great for bright environments'}
              </div>
            </div>
            <div className="text-2xl">{getThemeIcon()}</div>
          </div>
        </div>

        {/* Theme Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {themeOptions.map((option) => {
            const IconComponent = option.icon;
            const isSelected = theme === option.value;
            
            return (
              <motion.button
                key={option.value}
                onClick={() => setThemeMode(option.value)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                    : 'border-gray-200 dark:border-slate-600 hover:border-green-300'
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                aria-pressed={isSelected}
                role="radio"
                aria-label={`Switch to ${option.label}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    isSelected 
                      ? 'bg-green-100 dark:bg-green-800' 
                      : 'bg-gray-100 dark:bg-slate-600'
                  }`}>
                    <IconComponent className={`w-5 h-5 ${
                      isSelected 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800 dark:text-gray-200">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </motion.div>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Quick Toggle */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-800 dark:text-gray-200">Quick Toggle</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Switch between themes instantly
              </div>
            </div>
            <motion.button
              onClick={() => toggleTheme()}
              className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              aria-label="Toggle theme"
            >
              <motion.span
                animate={{ rotate: isDark ? 180 : 0 }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="text-lg"
              >
                {getThemeIcon()}
              </motion.span>
            </motion.button>
          </div>
        </div>

        {/* Theme Features */}
        <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
          <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-3">Theme Features</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>System preference detection</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Persistent across sessions</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Smooth transitions</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Accessibility compliant</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}








