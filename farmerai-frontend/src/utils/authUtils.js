import { auth } from '../firebase';

/**
 * Utility functions for handling authentication errors and token management
 */

/**
 * Handles authentication errors with appropriate user feedback
 * @param {Error} error - The error object from API calls
 * @param {Function} navigate - React Router navigate function
 * @param {string} fallbackPath - Path to redirect to on auth failure
 * @param {Object} options - Additional options
 */
export const handleAuthError = (error, navigate, fallbackPath = '/login', options = {}) => {
  const { showToast = true, clearTokens = true, customMessage } = options;
  
  console.error('🔒 Authentication error:', error);
  
  if (error.response?.status === 401) {
    if (clearTokens) {
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    
    if (showToast) {
      const message = customMessage || 'Your session has expired. Please login again.';
      // Use console.error instead of toast to avoid import issues
      console.error(message);
    }
    
    // Redirect to login with return URL
    const currentPath = window.location.pathname;
    navigate('/login', { 
      state: { 
        from: currentPath,
        message: 'Please login to continue'
      } 
    });
    return true; // Indicates auth error was handled
  }
  
  if (error.response?.status === 403) {
    if (showToast) {
      console.error('You do not have permission to access this resource.');
    }
    navigate(fallbackPath);
    return true;
  }
  
  if (error.response?.status === 404 && error.config?.url?.includes('/warehouse-bookings/')) {
    if (showToast) {
      console.error('Booking not found. It may have been cancelled or deleted.');
    }
    navigate('/my-bookings');
    return true;
  }
  
  return false; // Error was not an auth error
};

/**
 * Refreshes the Firebase ID token
 * @returns {Promise<string|null>} - The new token or null if refresh failed
 */
export const refreshFirebaseToken = async () => {
  try {
    if (!auth.currentUser) {
      console.warn('⚠️ No Firebase user found for token refresh');
      return null;
    }
    
    const newToken = await auth.currentUser.getIdToken(true); // Force refresh
    localStorage.setItem('token', newToken);
    console.log('✅ Firebase token refreshed successfully');
    return newToken;
  } catch (error) {
    console.error('❌ Failed to refresh Firebase token:', error);
    // Clear tokens on refresh failure
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return null;
  }
};

/**
 * Checks if the current user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const firebaseUser = auth.currentUser;
  const email = localStorage.getItem('email');
  
  console.log('🔍 isAuthenticated() check:');
  console.log('- Token exists:', !!token);
  console.log('- Firebase user exists:', !!firebaseUser);
  console.log('- Email exists:', !!email);
  
  // More lenient check - if we have a token OR Firebase user OR email, consider authenticated
  const isAuth = !!(token || firebaseUser || email);
  console.log('- Final result:', isAuth);
  
  return isAuth;
};

/**
 * Gets the current authentication token
 * @returns {string|null} - The current token or null
 */
export const getCurrentToken = () => {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

/**
 * Clears all authentication data
 */
export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('role');
  localStorage.removeItem('email');
  localStorage.removeItem('userId');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('role');
  sessionStorage.removeItem('email');
  sessionStorage.removeItem('userId');
  
  // Clear any cached data
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
      });
    });
  }
};

/**
 * Validates if a token is likely expired based on its structure
 * @param {string} token - The token to validate
 * @returns {boolean} - True if token appears to be expired
 */
export const isTokenExpired = (token) => {
  if (!token) return true;
  
  try {
    // For Firebase ID tokens, we can't easily check expiration client-side
    // For JWT tokens, we could decode and check exp claim
    // For now, we'll rely on the server response
    return false;
  } catch (error) {
    console.error('Error validating token:', error);
    return true;
  }
};
