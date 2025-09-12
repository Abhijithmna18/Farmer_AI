import React from 'react';
import { AlertTriangle, RefreshCw, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ErrorBoundary({ error, resetError, showRelogin = false }) {
  const navigate = useNavigate();

  const handleRelogin = () => {
    // Clear any stored auth data
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleRetry = () => {
    if (resetError) {
      resetError();
    } else {
      window.location.reload();
    }
  };

  if (!error) return null;

  // Determine error type and message
  const getErrorInfo = (error) => {
    if (error?.response?.status === 401) {
      return {
        title: 'Session Expired',
        message: 'Your session has expired. Please log in again to continue.',
        showRelogin: true,
        icon: LogIn
      };
    }
    
    if (error?.response?.status === 403) {
      return {
        title: 'Access Denied',
        message: 'You don\'t have permission to access this resource.',
        showRelogin: true,
        icon: AlertTriangle
      };
    }
    
    if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
      return {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection and try again.',
        showRelogin: false,
        icon: AlertTriangle
      };
    }
    
    return {
      title: 'Something went wrong',
      message: error?.message || 'An unexpected error occurred. Please try again.',
      showRelogin: showRelogin,
      icon: AlertTriangle
    };
  };

  const errorInfo = getErrorInfo(error);
  const IconComponent = errorInfo.icon;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-slate-900">
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <IconComponent className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
        </div>
        
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {errorInfo.title}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {errorInfo.message}
        </p>
        
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          {errorInfo.showRelogin && (
            <button
              onClick={handleRelogin}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Log In Again
            </button>
          )}
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 text-left">
            <summary className="text-sm text-gray-500 cursor-pointer">Error Details</summary>
            <pre className="mt-2 text-xs text-gray-400 bg-gray-100 dark:bg-slate-700 p-2 rounded overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}








