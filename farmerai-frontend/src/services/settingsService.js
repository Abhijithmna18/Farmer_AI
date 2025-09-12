import apiClient from './apiClient';

// Helper function to check token and handle auth errors
const handleApiRequest = async (apiCall, operation) => {
  try {
    console.log(`🔧 ${operation}: Starting request`);
    
    // Check if token exists
    const token = localStorage.getItem('token');
    if (!token) {
      console.error(`❌ ${operation}: No token found in localStorage`);
      throw new Error('No authentication token found. Please log in again.');
    }
    
    console.log(`🔑 ${operation}: Token found, length: ${token.length}`);
    
    const response = await apiCall();
    console.log(`✅ ${operation}: Request successful`);
    return response.data; // Return only data payload expected by callers
  } catch (error) {
    console.error(`❌ ${operation}: Request failed:`, error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      console.error('🔒 Authentication failed - clearing token');
      localStorage.removeItem('token');
      throw new Error('Authentication failed. Please log in again.');
    }
    
    if (error.response?.status === 403) {
      throw new Error('Access denied. You do not have permission to perform this action.');
    }
    
    if (error.response?.status >= 500) {
      throw new Error('Server error. Please try again later.');
    }
    
    // Re-throw with original message if it's a custom error
    throw error;
  }
};

// Preferences
export const getPreferences = async () => {
  return handleApiRequest(
    () => apiClient.get('/settings/preferences'),
    'Get Preferences'
  );
};

export const updatePreferences = async (preferences) => {
  return handleApiRequest(
    () => apiClient.put('/settings/preferences', preferences),
    'Update Preferences'
  );
};

// Security
export const changePassword = async (passwordData) => {
  return handleApiRequest(
    () => apiClient.put('/settings/password', passwordData),
    'Change Password'
  );
};

export const getLoginHistory = async () => {
  return handleApiRequest(
    () => apiClient.get('/settings/login-history'),
    'Get Login History'
  );
};

export const addLoginEntry = async (loginData) => {
  return handleApiRequest(
    () => apiClient.post('/settings/login-history', loginData),
    'Add Login Entry'
  );
};

// Notifications
export const getNotificationPreferences = async () => {
  return handleApiRequest(
    () => apiClient.get('/settings/notifications'),
    'Get Notification Preferences'
  );
};

export const updateNotificationPreferences = async (notifications) => {
  return handleApiRequest(
    () => apiClient.put('/settings/notifications', notifications),
    'Update Notification Preferences'
  );
};

export const sendTestNotification = async (type, method) => {
  console.log(`📧 Send Test Notification: type=${type}, method=${method}`);
  return handleApiRequest(
    () => apiClient.post('/settings/notifications/test', { type, method }),
    'Send Test Notification'
  );
};

// Profile
export const updateProfile = async (profileData) => {
  return handleApiRequest(
    () => apiClient.put('/settings/profile', profileData),
    'Update Profile'
  );
};

// Account
export const deleteAccount = async (password) => {
  console.log('🗑️ Delete Account: Request initiated');
  return handleApiRequest(
    () => apiClient.delete('/settings/account', { data: { password } }),
    'Delete Account'
  );
};

