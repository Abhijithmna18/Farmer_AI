import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ 
  variant = 'button', 
  size = 'md', 
  showText = false, 
  className = '',
  showToast = true 
}) {
  const { theme, toggleTheme, getThemeIcon, isLoading } = useTheme();

  const sizeClasses = {
    sm: 'p-2',
    md: 'p-3',
    lg: 'p-4'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = () => {
    if (!isLoading) {
      toggleTheme(showToast);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  if (variant === 'icon') {
    return (
      <motion.button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={`
          ${sizeClasses[size]} 
          rounded-lg 
          bg-gray-100 dark:bg-gray-800 
          text-gray-700 dark:text-gray-200 
          hover:bg-gray-200 dark:hover:bg-gray-700 
          focus:outline-none focus:ring-2 focus:ring-green-500 
          disabled:opacity-50 disabled:cursor-not-allowed 
          transition-all duration-200
          ${className}
        `}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.span
          className={`${iconSizes[size]} text-lg`}
          animate={{ rotate: theme === 'dark' ? 180 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {getThemeIcon()}
        </motion.span>
      </motion.button>
    );
  }

  if (variant === 'switch') {
    return (
      <motion.button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full
          ${theme === 'dark' ? 'bg-green-600' : 'bg-gray-200'}
          focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        role="switch"
        aria-checked={theme === 'dark'}
      >
        <motion.span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow-lg
            ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}
          `}
          animate={{
            x: theme === 'dark' ? 24 : 4,
          }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
        />
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        flex items-center gap-2
        rounded-lg
        bg-gray-100 dark:bg-gray-800
        text-gray-700 dark:text-gray-200
        hover:bg-gray-200 dark:hover:bg-gray-700
        focus:outline-none focus:ring-2 focus:ring-green-500
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-all duration-200
        ${className}
      `}
      aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <motion.span
        className={`${iconSizes[size]} text-lg`}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        {getThemeIcon()}
      </motion.span>
      {showText && (
        <span className="font-medium">
          {theme === 'dark' ? 'Dark' : 'Light'} Mode
        </span>
      )}
      {isLoading && (
        <motion.div
          className="w-4 h-4 border-2 border-gray-300 border-t-green-600 rounded-full"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.button>
  );
}