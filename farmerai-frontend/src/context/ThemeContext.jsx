import React, { createContext, useContext, useState, useEffect } from 'react';
import { updatePreferences } from '../services/settingsService';
import Toast from '../components/Toast';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Detect system preference
  const getSystemPreference = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Load theme from localStorage or system preference
  const loadTheme = () => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && ['light', 'dark'].includes(savedTheme)) {
        return savedTheme;
      }
      return getSystemPreference();
    } catch (error) {
      console.error('Error loading theme from localStorage:', error);
      return getSystemPreference();
    }
  };

  // Apply theme to document
  const applyTheme = (newTheme) => {
    const root = document.documentElement;
    
    // Add transition class for smooth theme change
    root.classList.add('theme-transitioning');
    
    // Remove old theme and add new theme
    root.classList.remove('light', 'dark');
    root.classList.add(newTheme);
    
    // Update meta theme-color for mobile browsers
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', newTheme === 'dark' ? '#1f2937' : '#ffffff');
    }
    
    // Remove transition class after animation completes
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 300);
  };

  // Save theme to localStorage
  const saveThemeToStorage = (newTheme) => {
    try {
      localStorage.setItem('theme', newTheme);
    } catch (error) {
      console.error('Error saving theme to localStorage:', error);
    }
  };

  // Save theme to database
  const saveThemeToDatabase = async (newTheme) => {
    try {
      await updatePreferences({ theme: newTheme });
    } catch (error) {
      console.error('Error saving theme to database:', error);
      // Don't show error toast for theme changes to avoid spam
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      setIsLoading(true);
      
      try {
        // Load theme from localStorage or system preference
        const initialTheme = loadTheme();
        setTheme(initialTheme);
        applyTheme(initialTheme);
        
        // Try to load theme from database (if user is logged in)
        try {
          // Use apiClient so auth header is included
          const { default: apiClient } = await import('../services/apiClient');
          const response = await apiClient.get('/settings/preferences');
          const data = response.data || response;
          if (data.preferences?.theme) {
            setTheme(data.preferences.theme);
            applyTheme(data.preferences.theme);
            saveThemeToStorage(data.preferences.theme);
          }
        } catch (dbError) {
          // User might not be logged in, continue with localStorage theme
          console.log('Could not load theme from database, using localStorage theme');
        }
      } catch (error) {
        console.error('Error initializing theme:', error);
        // Fallback to system preference
        const fallbackTheme = getSystemPreference();
        setTheme(fallbackTheme);
        applyTheme(fallbackTheme);
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleSystemThemeChange = (e) => {
        // Only apply system theme if no user preference is saved
        const savedTheme = localStorage.getItem('theme');
        if (!savedTheme) {
          const newTheme = e.matches ? 'dark' : 'light';
          setTheme(newTheme);
          applyTheme(newTheme);
        }
      };

      mediaQuery.addEventListener('change', handleSystemThemeChange);
      return () => mediaQuery.removeEventListener('change', handleSystemThemeChange);
    }
  }, []);

  // Toggle theme function
  const toggleTheme = async (showToast = true) => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    
    setTheme(newTheme);
    applyTheme(newTheme);
    saveThemeToStorage(newTheme);
    
    // Save to database in background
    saveThemeToDatabase(newTheme);
    
    if (showToast) {
      setToast({
        message: `${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`,
        type: 'success'
      });
    }
  };

  // Set specific theme
  const setThemeMode = async (newTheme, showToast = true) => {
    if (!['light', 'dark'].includes(newTheme)) {
      console.error('Invalid theme:', newTheme);
      return;
    }
    
    setTheme(newTheme);
    applyTheme(newTheme);
    saveThemeToStorage(newTheme);
    
    // Save to database in background
    saveThemeToDatabase(newTheme);
    
    if (showToast) {
      setToast({
        message: `${newTheme === 'dark' ? 'Dark' : 'Light'} mode enabled`,
        type: 'success'
      });
    }
  };

  // Get theme icon
  const getThemeIcon = () => {
    return theme === 'dark' ? '🌙' : '☀️';
  };

  // Check if theme is dark
  const isDark = theme === 'dark';

  const value = {
    theme,
    isDark,
    isLoading,
    toggleTheme,
    setThemeMode,
    getThemeIcon
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onDismiss={() => setToast({ message: '', type: 'info' })} 
      />
    </ThemeContext.Provider>
  );
}