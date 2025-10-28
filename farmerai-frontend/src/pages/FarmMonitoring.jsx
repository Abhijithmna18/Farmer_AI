// src/pages/FarmMonitoring.jsx
import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { 
  Thermometer, Droplets, Sprout, RefreshCw, TrendingUp, 
  AlertTriangle, CheckCircle, Clock, AlertCircle, Download, 
  Zap, Wind, Sun, CloudRain, Bell, Wifi, WifiOff, FileText, Activity
} from 'lucide-react';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import {
  fetchAndStoreSensorData,
  getLatestReading,
  getHistoricalData,
  getSensorStats,
  getPredictiveAnalytics,
  getAlerts
} from '../services/farmMonitoring.service';
import { AuthContext } from '../context/AuthContext';
import CustomAlertsManager from '../components/CustomAlertsManager';

// Color palette for charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function FarmMonitoring() {
  const { refreshToken, refreshSubscriptionStatus } = useContext(AuthContext);
  const [latestData, setLatestData] = useState(null);
  const [historicalData, setHistoricalData] = useState([]);
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchingNew, setFetchingNew] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [timeRange, setTimeRange] = useState(24); // hours
  const [authError, setAuthError] = useState(false);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [websocketStatus, setWebsocketStatus] = useState('disconnected');
  const [realTimeData, setRealTimeData] = useState(null);
  const [autoRefreshStatus, setAutoRefreshStatus] = useState('idle'); // idle, loading, error
  const [connectionError, setConnectionError] = useState(false); // Track connection errors
  
  // Refs for cleanup and preventing memory leaks
  const socketRef = useRef(null);
  const intervalRef = useRef(null);
  const isFetchingRef = useRef(false);
  const mountedRef = useRef(true); // Track if component is mounted
  const timeRangeRef = useRef(timeRange); // Ref to track timeRange changes

  // Update timeRangeRef when timeRange changes
  useEffect(() => {
    timeRangeRef.current = timeRange;
  }, [timeRange]);

  // Cleanup function to prevent state updates on unmounted component
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Safe state update that checks if component is still mounted
  const safeSetState = useCallback((setState, value) => {
    if (mountedRef.current) {
      setState(value);
    }
  }, []);

  // Fetch latest reading from backend (which fetches from Adafruit)
  const fetchLatest = useCallback(async () => {
    try {
      const response = await getLatestReading();
      if (response.success) {
        safeSetState(setLatestData, response.data);
        safeSetState(setLastUpdate, new Date());
        safeSetState(setAuthError, false);
        // Only clear connection error if we successfully fetched data
        if (connectionError) {
          safeSetState(setConnectionError, false);
          toast.success('✅ Live data connection restored');
        }
        return response.data;
      } else if (response.status === 401) {
        safeSetState(setAuthError, true);
      }
    } catch (error) {
      console.error('Error fetching latest data:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        safeSetState(setAuthError, true);
      } else {
        // For other errors, show connection error message but keep last data
        // Only show the error message once per connection issue
        if (!connectionError) {
          safeSetState(setConnectionError, true);
          toast.error('⚠️ Live data connection lost – showing last available reading.');
        }
      }
    }
  }, [connectionError, safeSetState]);

  // Fetch historical data
  const fetchHistory = useCallback(async () => {
    try {
      const response = await getHistoricalData(timeRangeRef.current, 100);
      if (response.success) {
        // Format data for Recharts
        const formattedData = response.data.map(item => ({
          timestamp: new Date(item.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
          }),
          temperature: item.temperature,
          humidity: item.humidity,
          soilMoisture: item.soilMoisture,
          fullDate: new Date(item.timestamp).toLocaleString()
        }));
        safeSetState(setHistoricalData, formattedData);
      }
    } catch (error) {
      console.error('Error fetching historical data:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        safeSetState(setAuthError, true);
      }
    }
  }, [safeSetState]);

  // Fetch statistics
  const fetchStats = useCallback(async () => {
    try {
      const response = await getSensorStats(timeRangeRef.current);
      if (response.success) {
        safeSetState(setStats, response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        safeSetState(setAuthError, true);
      }
    }
  }, [safeSetState]);

  // Fetch predictive analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await getPredictiveAnalytics(timeRangeRef.current);
      if (response.success) {
        safeSetState(setAnalytics, response.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        safeSetState(setAuthError, true);
      }
    }
  }, [safeSetState]);

  // Fetch alerts
  const fetchAlerts = useCallback(async () => {
    try {
      const response = await getAlerts();
      if (response.success) {
        safeSetState(setAlerts, response.data.alerts);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Handle authentication errors
      if (error.response?.status === 401) {
        safeSetState(setAuthError, true);
      }
    }
  }, [safeSetState]);

  // Fetch new data from Adafruit with proper status handling
  const handleFetchNew = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }
    
    isFetchingRef.current = true;
    safeSetState(setFetchingNew, true);
    safeSetState(setAutoRefreshStatus, 'loading');
    
    try {
      const response = await fetchAndStoreSensorData();
      console.log('Fetch response:', response);
      if (response.success) {
        toast.success('Sensor data updated successfully!');
        await Promise.all([
          fetchLatest(),
          fetchHistory(),
          fetchStats(),
          fetchAnalytics(),
          fetchAlerts()
        ]);
        safeSetState(setAutoRefreshStatus, 'idle');
      } else {
        // Handle error response
        safeSetState(setAutoRefreshStatus, 'error');
        if (response.status === 401) {
          safeSetState(setAuthError, true);
          toast.error('Authentication required. Please log in.');
        } else {
          toast.error(response.message || 'Failed to fetch sensor data');
        }
      }
    } catch (error) {
      console.error('Unexpected error in handleFetchNew:', error);
      safeSetState(setAutoRefreshStatus, 'error');
      toast.error('Unexpected error occurred while fetching data');
    } finally {
      safeSetState(setFetchingNew, false);
      isFetchingRef.current = false;
    }
  };

  // Export data as CSV
  const handleExportCSV = async () => {
    safeSetState(setExportingCSV, true);
    try {
      const result = await exportSensorDataCSV(timeRange);
      if (result.success) {
        toast.success('CSV data exported successfully!');
      } else {
        toast.error(result.message || 'Failed to export CSV data');
      }
    } catch (error) {
      toast.error('Failed to export CSV data');
    } finally {
      safeSetState(setExportingCSV, false);
    }
  };

  // Export data as PDF
  const handleExportPDF = async () => {
    safeSetState(setExportingPDF, true);
    try {
      const result = await exportSensorDataPDF(timeRange);
      if (result.success) {
        toast.success('PDF report generated successfully!');
      } else {
        toast.error(result.message || 'Failed to generate PDF report');
      }
    } catch (error) {
      toast.error('Failed to generate PDF report');
    } finally {
      safeSetState(setExportingPDF, false);
    }
  };

  // Initialize Socket.IO connection
  const initSocketIO = useCallback(() => {
    try {
      // Get the Socket.IO server URL from environment
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5002';
      console.log('Connecting to Socket.IO server:', apiBaseUrl);
      safeSetState(setWebsocketStatus, 'connecting');
      
      // Create Socket.IO connection
      const socket = io(apiBaseUrl, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        randomizationFactor: 0.5
      });
      socketRef.current = socket;
      
      socket.on('connect', () => {
        if (mountedRef.current) {
          safeSetState(setWebsocketStatus, 'connected');
          console.log('Socket.IO connected with ID:', socket.id);
          // Only show success message if we were previously disconnected
          if (connectionError) {
            toast.success('✅ Live data connection restored');
          }
          safeSetState(setConnectionError, false); // Clear connection error on successful reconnect
        }
      });
      
      socket.on('sensorDataUpdate', (data) => {
        console.log('Received sensor data update:', data);
        if (mountedRef.current) {
          safeSetState(setRealTimeData, data);
          // Update latest data with real-time values
          safeSetState(setLatestData, prev => ({
            ...prev,
            ...data,
            timestamp: new Date()
          }));
          
          // Update last update time
          safeSetState(setLastUpdate, new Date());
          
          // Show toast notification for critical changes
          if (data.needsIrrigation && (!latestData || !latestData.needsIrrigation)) {
            toast.error('⚠️ Soil moisture low! Irrigation needed immediately!');
          }
        }
      });
      
      socket.on('disconnect', (reason) => {
        if (mountedRef.current) {
          console.log('Socket.IO disconnected:', reason);
          safeSetState(setWebsocketStatus, 'disconnected');
          // Only show error if it was an unexpected disconnect
          if (reason !== 'io client disconnect') {
            // Only set connection error if we haven't already
            if (!connectionError) {
              safeSetState(setConnectionError, true);
              toast.error('⚠️ Live data connection lost – showing last available reading.');
            }
          }
        }
      });
      
      socket.on('connect_error', (error) => {
        if (mountedRef.current) {
          console.error('Socket.IO connection error:', error);
          safeSetState(setWebsocketStatus, 'error');
          // Only show error once per connection issue
          if (!connectionError) {
            safeSetState(setConnectionError, true);
            toast.error('⚠️ Live data connection lost – showing last available reading.');
          }
        }
      });
      
      socket.on('error', (error) => {
        if (mountedRef.current) {
          console.error('Socket.IO error:', error);
          safeSetState(setWebsocketStatus, 'error');
          // Only show error once per connection issue
          if (!connectionError) {
            safeSetState(setConnectionError, true);
            toast.error('⚠️ Live data connection lost – showing last available reading.');
          }
        }
      });
    } catch (error) {
      console.error('Socket.IO connection error:', error);
      if (mountedRef.current) {
        safeSetState(setWebsocketStatus, 'error');
        // Only show error once per connection issue
        if (!connectionError) {
          safeSetState(setConnectionError, true);
          toast.error('⚠️ Live data connection lost – showing last available reading.');
        }
      }
    }
  }, [latestData, connectionError, safeSetState]);

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      safeSetState(setLoading, true);
      try {
        await Promise.all([
          fetchLatest(), 
          fetchHistory(), 
          fetchStats(),
          fetchAnalytics(),
          fetchAlerts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        // Handle authentication errors
        if (error.response?.status === 401) {
          safeSetState(setAuthError, true);
        }
      } finally {
        safeSetState(setLoading, false);
      }
    };
    loadData();
    
    // Initialize Socket.IO
    initSocketIO();
    
    // Cleanup Socket.IO on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // Empty dependency array to prevent re-running on every render

  // Auto-refresh every 5 minutes with proper error handling and cleanup
  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Don't set up interval if already fetching or if component is unmounting
    if (isFetchingRef.current || !mountedRef.current) {
      return;
    }

    // Set up new interval for auto-refresh
    const fetchDataInterval = async () => {
      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current || !mountedRef.current) {
        console.log('Auto-refresh already in progress or component unmounted, skipping...');
        return;
      }
      
      console.log('Auto-refresh triggered - fetching sensor data...');
      isFetchingRef.current = true;
      safeSetState(setAutoRefreshStatus, 'loading');
      
      try {
        // Attempt to fetch new data from Adafruit IO
        const response = await fetchAndStoreSensorData();
        console.log('Auto-refresh response:', response);
        
        if (response.success) {
          console.log('Auto-refresh successful');
          // Update all data components
          await Promise.all([
            fetchLatest(),
            fetchHistory(),
            fetchAlerts()
          ]);
          safeSetState(setAutoRefreshStatus, 'idle');
        } else {
          console.warn('Auto-refresh failed:', response.message);
          safeSetState(setAutoRefreshStatus, 'error');
          // Only show toast error if it's not an auth error (which is handled separately)
          if (response.status !== 401) {
            toast.error('⚠️ Unable to fetch data, retrying...');
          }
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
        safeSetState(setAutoRefreshStatus, 'error');
        // Only show error once per connection issue
        if (!connectionError) {
          safeSetState(setConnectionError, true);
          toast.error('⚠️ Live data connection lost – showing last available reading.');
        }
        
        // Even on error, we still want to update the UI with latest available data
        try {
          await Promise.all([
            fetchLatest(),
            fetchHistory(),
            fetchAlerts()
          ]);
        } catch (uiError) {
          console.error('Failed to update UI after auto-refresh error:', uiError);
        }
      } finally {
        isFetchingRef.current = false;
      }
    };

    // Run immediately on mount (but not if already fetching)
    if (!isFetchingRef.current && mountedRef.current) {
      fetchDataInterval();
    }
    
    // Set up interval for subsequent fetches every 5 minutes (300,000 ms)
    intervalRef.current = setInterval(() => {
      if (!isFetchingRef.current && mountedRef.current) {
        fetchDataInterval();
      }
    }, 300000);

    // Cleanup function to clear interval on unmount
    return () => {
      if (intervalRef.current) {
        console.log('Clearing auto-refresh interval');
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      isFetchingRef.current = false;
    };
  }, []); // Empty dependency array to prevent re-running on every render

  // Get status color and icon
  const getStatusInfo = () => {
    if (!latestData) return { color: 'gray', icon: Clock, message: 'No Data' };
    
    if (latestData.soilMoisture < 300) {
      return { 
        color: 'red', 
        icon: AlertTriangle, 
        message: 'Irrigation Needed',
        bgColor: 'bg-red-50',
        textColor: 'text-red-700',
        borderColor: 'border-red-200'
      };
    } else if (latestData.soilMoisture < 500) {
      return { 
        color: 'yellow', 
        icon: AlertTriangle, 
        message: 'Soil Moisture Low',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-700',
        borderColor: 'border-yellow-200'
      };
    } else {
      return { 
        color: 'green', 
        icon: CheckCircle, 
        message: 'Soil Moisture Normal',
        bgColor: 'bg-green-50',
        textColor: 'text-green-700',
        borderColor: 'border-green-200'
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Prepare data for charts
  const prepareTrendData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Temperature', value: analytics.temperature.trend },
      { name: 'Humidity', value: analytics.humidity.trend },
      { name: 'Soil Moisture', value: analytics.soilMoisture.trend }
    ];
  };

  const trendData = prepareTrendData();

  // Prepare data for volatility chart
  const prepareVolatilityData = () => {
    if (!analytics) return [];
    
    return [
      { name: 'Temperature', value: analytics.temperature.stdDev },
      { name: 'Humidity', value: analytics.humidity.stdDev },
      { name: 'Soil Moisture', value: analytics.soilMoisture.stdDev }
    ];
  };

  const volatilityData = prepareVolatilityData();

  // Show loading state with message
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading sensor data...</p>
        </div>
      </div>
    );
  }

  // Show authentication error message
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to access farm monitoring data.
            </p>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-700 dark:text-red-300 text-sm">
                <strong>Issue:</strong> Farm monitoring requires authentication. 
                Please ensure you are logged in and have a valid session.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={async () => {
                  try {
                    // Try to refresh the token
                    await refreshToken();
                    window.location.reload();
                  } catch (error) {
                    console.error('Failed to refresh token:', error);
                    window.location.href = '/login';
                  }
                }}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                Refresh Session
              </button>
              <button
                onClick={async () => {
                  try {
                    // Try to refresh the user session first
                    await refreshSubscriptionStatus();
                    // Then refresh the data without full page reload
                    await handleFetchNew();
                  } catch (error) {
                    console.error('Failed to refresh session:', error);
                    // Only reload if refresh fails
                    window.location.reload();
                  }
                }}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-white dark:from-slate-900 dark:to-slate-950 p-4 md:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
              🌾 Farm Monitoring Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Real-time sensor data from your ESP32 device via Adafruit IO
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow">
              {websocketStatus === 'connected' ? (
                <Wifi className="w-5 h-5 text-green-500" />
              ) : websocketStatus === 'connecting' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div>
              ) : (
                <WifiOff className="w-5 h-5 text-red-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {websocketStatus === 'connected' ? 'Live' : websocketStatus === 'connecting' ? 'Connecting...' : 'Offline'}
              </span>
            </div>
            
            {/* Auto-refresh status indicator */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg shadow">
              {autoRefreshStatus === 'loading' ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              ) : autoRefreshStatus === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {autoRefreshStatus === 'loading' ? 'Loading Data...' : 
                 autoRefreshStatus === 'error' ? 'Retry in 5 min' : 'Auto Refresh'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCSV}
                disabled={exportingCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <Download className="w-5 h-5" />
                {exportingCSV ? 'Exporting...' : 'Export CSV'}
              </button>
              
              <button
                onClick={handleExportPDF}
                disabled={exportingPDF}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                <FileText className="w-5 h-5" />
                {exportingPDF ? 'Generating...' : 'Export PDF'}
              </button>
            </div>
            
            <button
              onClick={handleFetchNew}
              disabled={fetchingNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
            >
              <RefreshCw className={`w-5 h-5 ${fetchingNew ? 'animate-spin' : ''}`} />
              {fetchingNew ? 'Fetching...' : 'Fetch New Data'}
            </button>
            
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(Number(e.target.value))}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-800 dark:text-white focus:ring-2 focus:ring-green-500"
            >
              <option value={1}>Last Hour</option>
              <option value={6}>Last 6 Hours</option>
              <option value={12}>Last 12 Hours</option>
              <option value={24}>Last 24 Hours</option>
              <option value={48}>Last 48 Hours</option>
              <option value={168}>Last Week</option>
            </select>
          </div>
        </div>
        
        {lastUpdate && (
          <div className="text-sm text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Last updated: {lastUpdate.toLocaleTimeString()}
            {realTimeData && (
              <span className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Live
              </span>
            )}
          </div>
        )}
        
        {/* Connection error message */}
        {connectionError && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <span className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ Live data connection lost – showing last available reading.
            </span>
          </div>
        )}
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-500" />
            Critical Alerts
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {alerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-xl border-2 ${
                  alert.severity === 'critical' ? 'bg-red-50 border-red-300 dark:bg-red-900/30 dark:border-red-700' :
                  alert.severity === 'high' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' : 
                  alert.severity === 'medium' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                  'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  {alert.severity === 'critical' ? (
                    <AlertCircle className="w-6 h-6 flex-shrink-0 text-red-500" />
                  ) : alert.severity === 'high' ? (
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
                  ) : alert.severity === 'medium' ? (
                    <AlertTriangle className="w-6 h-6 flex-shrink-0 text-yellow-500" />
                  ) : (
                    <Bell className="w-6 h-6 flex-shrink-0 text-blue-500" />
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-800 dark:text-white">
                      {alert.type.charAt(0).toUpperCase() + alert.type.slice(1)} Alert
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {alert.message}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Recommendation: {alert.recommendation}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Alert */}
      {latestData && (
        <div className={`mb-6 p-4 rounded-xl border-2 ${statusInfo.bgColor} ${statusInfo.borderColor} shadow-lg`}>
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${statusInfo.textColor}`} />
            <div>
              <h3 className={`text-lg font-bold ${statusInfo.textColor}`}>
                {statusInfo.message}
              </h3>
              <p className={`text-sm ${statusInfo.textColor}`}>
                Current soil moisture: {latestData.soilMoisture} 
                {latestData.soilMoisture < 300 && ' - Please water your crops'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Readings Cards */}
      {latestData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Temperature Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-orange-100 dark:border-orange-900 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Thermometer className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Temperature</h3>
              </div>
              <Sun className="w-5 h-5 text-orange-500" />
            </div>
            <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
              {latestData.temperature}°C
            </div>
            {stats && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Min: {stats.temperature.min.toFixed(1)}°C</div>
                <div>Max: {stats.temperature.max.toFixed(1)}°C</div>
                <div>Avg: {stats.temperature.avg.toFixed(1)}°C</div>
              </div>
            )}
          </div>

          {/* Humidity Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-blue-100 dark:border-blue-900 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <Droplets className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Humidity</h3>
              </div>
              <CloudRain className="w-5 h-5 text-blue-500" />
            </div>
            <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
              {latestData.humidity}%
            </div>
            {stats && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Min: {stats.humidity.min.toFixed(1)}%</div>
                <div>Max: {stats.humidity.max.toFixed(1)}%</div>
                <div>Avg: {stats.humidity.avg.toFixed(1)}%</div>
              </div>
            )}
          </div>

          {/* Soil Moisture Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-green-100 dark:border-green-900 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <Sprout className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Soil Moisture</h3>
              </div>
              <Droplets className="w-5 h-5 text-green-500" />
            </div>
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
              {latestData.soilMoisture}
            </div>
            {stats && (
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <div>Min: {stats.soilMoisture.min.toFixed(0)}</div>
                <div>Max: {stats.soilMoisture.max.toFixed(0)}</div>
                <div>Avg: {stats.soilMoisture.avg.toFixed(0)}</div>
              </div>
            )}
          </div>

          {/* Predictive Analytics Card */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-2 border-purple-100 dark:border-purple-900 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <Zap className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Analytics</h3>
              </div>
              <Activity className="w-5 h-5 text-purple-500" />
            </div>
            {analytics ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Trend</span>
                  <span className={`text-sm font-medium ${
                    analytics.soilMoisture.trend > 0 ? 'text-green-600' : 
                    analytics.soilMoisture.trend < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {analytics.soilMoisture.trend > 0 ? '↑ Rising' : 
                     analytics.soilMoisture.trend < 0 ? '↓ Falling' : '→ Stable'}
                  </span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {analytics.recommendations.length > 0 
                    ? analytics.recommendations[0] 
                    : 'Conditions are stable'}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 dark:text-gray-400 text-sm">
                Loading analytics...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Temperature & Humidity Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Environmental Trends
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#f97316" 
                strokeWidth={2}
                name="Temperature (°C)"
                dot={{ fill: '#f97316' }}
              />
              <Line 
                type="monotone" 
                dataKey="humidity" 
                stroke="#3b82f6" 
                strokeWidth={2}
                name="Humidity (%)"
                dot={{ fill: '#3b82f6' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Soil Moisture Chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sprout className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Soil Moisture Trend
            </h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={historicalData}>
              <defs>
                <linearGradient id="colorSoil" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="timestamp" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
              />
              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="soilMoisture" 
                stroke="#10b981" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorSoil)"
                name="Soil Moisture"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Additional Analytics */}
      {analytics && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trend Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Trend Analysis
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {trendData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Positive values indicate increasing trends, negative values indicate decreasing trends.
            </div>
          </div>

          {/* Volatility Analysis */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Data Volatility
              </h2>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={volatilityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value">
                  {volatilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Higher values indicate more variable conditions.
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wind className="w-5 h-5 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Recommendations
              </h2>
            </div>
            {analytics.recommendations.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {analytics.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <Wind className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <p className="text-gray-700 dark:text-gray-300">{rec}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                <p className="text-gray-700 dark:text-gray-300">
                  All conditions are optimal. No immediate actions required.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Custom Alerts Manager */}
      <div className="mb-8">
        <CustomAlertsManager />
      </div>

      {/* Data Information */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
          Data Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Sensor Range</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Temperature: -50°C to 100°C</li>
              <li>Humidity: 0% to 100%</li>
              <li>Soil Moisture: 0 to 4095</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Irrigation Guide</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>Below 300: Immediate irrigation needed</li>
              <li>300-500: Soil moisture low</li>
              <li>500-800: Optimal moisture level</li>
              <li>Above 800: Check drainage</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-50 dark:bg-slate-700 rounded-lg">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Data Points</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {stats ? `${stats.dataPoints} records in the last ${stats.period}` : 'Loading...'}
            </p>
          </div>
        </div>
        
        {/* Adafruit IO Feed Information */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-800 dark:text-white mb-3">Adafruit IO Feed Mapping</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Temperature</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Feed: dht-temp</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Humidity</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Feed: dht-hum</p>
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <div className="w-3 h-3 rounded-full bg-amber-500"></div>
              <div>
                <p className="text-sm font-medium text-gray-800 dark:text-white">Soil Moisture</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">Feed: soil-moisture</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Polling Interval:</span> Data is automatically fetched every 5 minutes from Adafruit IO
            </p>
          </div>
        </div>
      </div>

      {/* No Data Message */}
      {!latestData && !loading && !authError && (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-12 text-center">
          <Sprout className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
            No Sensor Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click "Fetch New Data" to retrieve sensor data from your ESP32 device
          </p>
          <button
            onClick={handleFetchNew}
            disabled={fetchingNew}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-lg hover:shadow-xl"
          >
            {fetchingNew ? 'Fetching...' : 'Fetch Sensor Data'}
          </button>
        </div>
      )}
    </div>
  );
}