import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5002/api";
const API_BASE = RAW_BASE;

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ensure cookies (sessions) travel with requests
});

// Log the base URL for debugging
console.log('API Base URL:', API_BASE);

// Add a timeout to prevent hanging requests
apiClient.defaults.timeout = 10000; // 10 seconds

// Add request interceptor to add token if present and set proper Content-Type
apiClient.interceptors.request.use((config) => {
  console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  console.log('🌐 API Request config:', config);
  
  // Try to get token from localStorage first
  let token = localStorage.getItem("token");
  
  // If not found, try sessionStorage
  if (!token) {
    token = sessionStorage.getItem("token");
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`🔑 Token attached: ${token.substring(0, 20)}...`);
  } else {
    console.warn('⚠️ No token found in localStorage or sessionStorage');
  }

  // Let the browser/axios set the correct boundary for FormData
  if (config.data instanceof FormData) {
    if (config.headers && config.headers["Content-Type"]) {
      delete config.headers["Content-Type"];
    }
    console.log('📎 FormData detected - Content-Type will be set by browser');
  } else {
    // Default JSON for non-FormData requests if not already set
    if (config.headers && !config.headers["Content-Type"]) {
      config.headers["Content-Type"] = "application/json";
    }
  }
  
  console.log('📤 Request headers:', config.headers);
  return config;
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
    console.log('✅ API Response data:', response.data);
    return response;
  },
  async (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      request: error.request,
      config: error.config
    });
    
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized - token may be expired or invalid');
      
      // Try to refresh the token
      try {
        // Try to get a fresh token from Firebase if user is logged in
        const authModule = await import("../firebase");
        const auth = authModule.auth;
        
        if (auth?.currentUser) {
          const newToken = await auth.currentUser.getIdToken(true); // Force refresh
          localStorage.setItem("token", newToken);
          console.log('✅ Firebase token refreshed successfully');
          
          // Retry the original request with the new token
          const originalRequest = error.config;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          console.log('🔁 Retrying original request with refreshed token');
          return apiClient(originalRequest);
        } else {
          // For admin login or other JWT tokens, try to refresh via backend
          // This is a simplified approach - in a real app, you might have a refresh token endpoint
          console.log('🧹 Clearing expired token and redirecting to login');
          localStorage.removeItem('token');
          sessionStorage.removeItem('token');
          // Optionally redirect to login page
          // window.location.href = '/login';
        }
      } catch (refreshError) {
        console.error('❌ Failed to refresh token:', refreshError);
        // Clear tokens on refresh failure
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;