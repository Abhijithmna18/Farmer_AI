// src/services/farmMonitoring.service.js
import apiClient from './apiClient';

// Track retry attempts to prevent excessive retries
let retryCount = 0;
const MAX_RETRIES = 3;

/**
 * Handle authentication errors consistently across all functions
 */
const handleAuthError = async (error, functionName) => {
  console.error(`Error in ${functionName}:`, error);
  
  if (error.response?.status === 401) {
    console.error(`Authentication required for ${functionName}`);
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found. User may not be logged in.');
    } else {
      console.error('Token found but may be invalid or expired.');
      
      // Try to refresh the token
      try {
        // Import AuthContext and try to refresh token
        console.log('Attempting to refresh token...');
        // We can't directly import AuthContext here, so we'll rely on the apiClient interceptor
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
      }
    }
  } else if (error.response?.status === 404) {
    console.error(`Endpoint not found for ${functionName}. This might be a routing issue.`);
  }
  
  throw error;
};

/**
 * Fetch sensor data from Adafruit IO and store in database
 * This function triggers an immediate fetch from Adafruit IO
 */
export const fetchAndStoreSensorData = async () => {
  // Prevent excessive retries
  if (retryCount >= MAX_RETRIES) {
    console.warn('Max retries reached for fetchAndStoreSensorData, skipping...');
    return {
      success: false,
      message: 'Max retry attempts reached. Please try again later.',
      error: 'Max retries exceeded'
    };
  }
  
  try {
    console.log('Fetching sensor data from backend...');
    const response = await apiClient.post('/farm-monitoring/fetch');
    console.log('Sensor data fetch successful:', response.data);
    
    // Reset retry count on success
    retryCount = 0;
    return response.data;
  } catch (error) {
    console.error('Error fetching sensor data:', error);
    retryCount++;
    
    // Instead of calling handleAuthError which throws, let's return a proper error response
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response from server:', error.response);
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch sensor data',
        error: error.response.data?.error || error.message,
        status: error.response.status
      };
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from server:', error.request);
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Error setting up request:', error.message);
      return {
        success: false,
        message: 'Error setting up request',
        error: error.message
      };
    }
  }
};

/**
 * Get latest sensor reading
 */
export const getLatestReading = async () => {
  try {
    const response = await apiClient.get('/farm-monitoring/latest');
    return response.data;
  } catch (error) {
    console.error('Error in getLatestReading:', error);
    if (error.response) {
      return {
        success: false,
        message: error.response.data?.message || 'Failed to fetch latest reading',
        error: error.response.data?.error || error.message,
        status: error.response.status
      };
    } else if (error.request) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    } else {
      return {
        success: false,
        message: 'Error setting up request',
        error: error.message
      };
    }
  }
};

/**
 * Get historical sensor data
 * @param {number} hours - Number of hours to fetch (default: 24)
 * @param {number} limit - Number of data points (default: 100)
 */
export const getHistoricalData = async (hours = 24, limit = 100) => {
  try {
    const { data } = await apiClient.get('/farm-monitoring/history', {
      params: { hours, limit }
    });
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'getHistoricalData');
  }
};

/**
 * Get sensor statistics
 * @param {number} hours - Number of hours to analyze (default: 24)
 */
export const getSensorStats = async (hours = 24) => {
  try {
    const { data } = await apiClient.get('/farm-monitoring/stats', {
      params: { hours }
    });
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'getSensorStats');
  }
};

/**
 * Manually add sensor data (for testing)
 */
export const addSensorData = async (sensorData) => {
  try {
    const { data } = await apiClient.post('/farm-monitoring/add', sensorData);
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'addSensorData');
  }
};

/**
 * Export sensor data as CSV
 * @param {number} hours - Number of hours to export (default: 24)
 */
export const exportSensorDataCSV = async (hours = 24) => {
  try {
    const response = await apiClient.get('/farm-monitoring/export', {
      params: { hours },
      responseType: 'blob' // Important for file download
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `sensor-data-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    return { success: true, message: 'Data exported successfully' };
  } catch (error) {
    console.error('CSV export error:', error);
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    // Handle case where we get a JSON error response instead of blob
    if (error.response && error.response.data instanceof Blob) {
      // Try to read the blob as text to get error message
      const errorText = await error.response.data.text();
      try {
        const errorJson = JSON.parse(errorText);
        return {
          success: false,
          message: errorJson.message || 'Failed to export CSV data',
          error: errorJson.error || 'Export failed'
        };
      } catch (e) {
        // If we can't parse as JSON, return the text as the message
        return {
          success: false,
          message: errorText || 'Failed to export CSV data',
          error: 'Export failed'
        };
      }
    }
    return handleAuthError(error, 'exportSensorDataCSV');
  }
};

/**
 * Export sensor data as PDF
 * @param {number} hours - Number of hours to export (default: 24)
 */
export const exportSensorDataPDF = async (hours = 24) => {
  try {
    // Dynamically import jsPDF to reduce initial bundle size
    const { jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');
    
    // Get the data
    const response = await getHistoricalData(hours);
    
    if (!response.success) {
      throw new Error('Failed to fetch data for PDF export');
    }
    
    const data = response.data;
    
    // Create PDF document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Farm Monitoring Report', 105, 20, null, null, 'center');
    
    // Add subtitle with date range
    doc.setFontSize(12);
    const now = new Date();
    const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
    doc.text(`Data from ${startDate.toLocaleString()} to ${now.toLocaleString()}`, 105, 30, null, null, 'center');
    
    // Prepare table data
    const tableData = data.map(item => [
      new Date(item.timestamp).toLocaleString(),
      item.temperature.toFixed(2),
      item.humidity.toFixed(2),
      item.soilMoisture.toFixed(0),
      item.source
    ]);
    
    // Add table
    autoTable(doc, {
      head: [['Timestamp', 'Temperature (°C)', 'Humidity (%)', 'Soil Moisture', 'Source']],
      body: tableData,
      startY: 40,
      styles: {
        fontSize: 8
      },
      headStyles: {
        fillColor: [16, 185, 129] // Green color
      }
    });
    
    // Add summary statistics if available
    const statsResponse = await getSensorStats(hours);
    if (statsResponse.success) {
      const stats = statsResponse.data;
      let finalY = doc.lastAutoTable.finalY + 10;
      
      doc.setFontSize(14);
      doc.text('Summary Statistics', 14, finalY);
      
      finalY += 10;
      doc.setFontSize(10);
      doc.text(`Temperature: Min ${stats.temperature.min.toFixed(2)}°C, Max ${stats.temperature.max.toFixed(2)}°C, Avg ${stats.temperature.avg.toFixed(2)}°C`, 14, finalY);
      
      finalY += 7;
      doc.text(`Humidity: Min ${stats.humidity.min.toFixed(2)}%, Max ${stats.humidity.max.toFixed(2)}%, Avg ${stats.humidity.avg.toFixed(2)}%`, 14, finalY);
      
      finalY += 7;
      doc.text(`Soil Moisture: Min ${stats.soilMoisture.min.toFixed(0)}, Max ${stats.soilMoisture.max.toFixed(0)}, Avg ${stats.soilMoisture.avg.toFixed(0)}`, 14, finalY);
    }
    
    // Save the PDF
    doc.save(`sensor-data-report-${new Date().toISOString().slice(0, 10)}.pdf`);
    
    return { success: true, message: 'PDF exported successfully' };
  } catch (error) {
    console.error('Error exporting PDF:', error);
    return { success: false, message: 'Failed to export PDF: ' + error.message };
  }
};

/**
 * Get predictive analytics for crop conditions
 * @param {number} hours - Number of hours to analyze (default: 24)
 */
export const getPredictiveAnalytics = async (hours = 24) => {
  try {
    const { data } = await apiClient.get('/farm-monitoring/analytics', {
      params: { hours }
    });
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'getPredictiveAnalytics');
  }
};

/**
 * Get alert conditions
 */
export const getAlerts = async () => {
  try {
    const { data } = await apiClient.get('/farm-monitoring/alerts');
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'getAlerts');
  }
};

/**
 * Create a custom alert
 * @param {Object} alertData - The alert configuration
 */
export const createCustomAlert = async (alertData) => {
  try {
    const { data } = await apiClient.post('/farm-monitoring/alerts', alertData);
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'createCustomAlert');
  }
};

/**
 * Get all custom alerts
 */
export const getCustomAlerts = async () => {
  try {
    const { data } = await apiClient.get('/farm-monitoring/alerts/custom');
    return data;
  } catch (error) {
    // For network errors, we still want to return a consistent structure
    if (error.request && !error.response) {
      return {
        success: false,
        message: 'No response received from server. Check your network connection.',
        error: 'Network error or server is not running'
      };
    }
    return handleAuthError(error, 'getCustomAlerts');
  }
};

// Reset retry count when the module is reloaded
retryCount = 0;