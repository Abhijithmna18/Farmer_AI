import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import Toast from './Toast';
import apiClient from '../services/apiClient';

export default function LogoutButton({ className = "", showText = true, variant = "button" }) {
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const { logout } = useAuth();
  const navigate = useNavigate();
  const toastTimeoutRef = useRef(null);

  // Clear timeout on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const handleLogout = async () => {
    if (loading) return;
    
    setLoading(true);
    try {
      // Clear any cached data in the apiClient
      if (apiClient.clearCache) {
        apiClient.clearCache();
      }
      
      // Clear browser cache
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            caches.delete(name);
          });
        });
      }
      
      const result = await logout();
      
      if (result.success) {
        setToast({ message: result.message, type: 'success' });
        // Redirect to login after a short delay
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setToast({ message: result.message, type: 'error' });
        // Clear loading state on error
        setLoading(false);
      }
    } catch (error) {
      setToast({ message: 'Logout failed. Please try again.', type: 'error' });
      // Clear loading state on error
      setLoading(false);
    }
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 300); // Small delay to prevent flashing
  };

  if (variant === "icon") {
    return (
      <>
        <button
          onClick={handleLogout}
          disabled={loading}
          className={`p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors duration-200 disabled:opacity-50 ${className}`}
          title="Logout"
          aria-label="Logout"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
        {toast.message && (
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onDismiss={dismissToast} 
          />
        )}
      </>
    );
  }

  return (
    <>
      <button
        onClick={handleLogout}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors duration-200 disabled:opacity-50 ${className}`}
        aria-label="Logout"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {showText && (loading ? 'Logging out...' : 'Logout')}
      </button>
      {toast.message && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onDismiss={dismissToast} 
        />
      )}
    </>
  );
}