import axios from "axios";

const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_BASE = (() => {
  try {
    // Ensure trailing /api exists
    const url = RAW_BASE.replace(/\/$/, "");
    if (/\/api$/.test(url)) return url;
    return url + "/api";
  } catch {
    return "http://localhost:5000/api";
  }
})();

const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true, // ensure cookies (sessions) travel with requests
});

// Add request interceptor to add token if present and set proper Content-Type
apiClient.interceptors.request.use((config) => {
  console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`);
  
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log(`🔑 Token attached: ${token.substring(0, 20)}...`);
  } else {
    console.warn('⚠️ No token found in localStorage');
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
    return response;
  },
  (error) => {
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
    console.error('Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });
    
    // Handle 401 errors globally
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized - clearing token and redirecting to login');
      localStorage.removeItem('token');
      // You might want to redirect to login page here
      // window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;