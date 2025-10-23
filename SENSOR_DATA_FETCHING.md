# Sensor Data Fetching Implementation

## Overview

This document describes the implementation of the sensor data fetching system for the FarmerAI application. The system automatically fetches sensor data every 5 minutes from Adafruit IO and updates the UI in real-time.

## Architecture

The system consists of three main components:

1. **Frontend (React)** - Displays data and handles user interactions
2. **Backend (Node.js/Express)** - Fetches data from Adafruit IO and stores it in MongoDB
3. **Adafruit IO** - IoT platform that collects data from ESP32 sensors

## Implementation Details

### Frontend Implementation

#### Auto-Refresh Mechanism

The frontend implements an auto-refresh mechanism using `useEffect` and `setInterval`:

```javascript
useEffect(() => {
  // Clear any existing interval
  if (intervalRef.current) {
    clearInterval(intervalRef.current);
  }

  // Set up new interval for auto-refresh
  const fetchDataInterval = async () => {
    console.log('Auto-refresh triggered - fetching sensor data...');
    setAutoRefreshStatus('loading');
    
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
        setAutoRefreshStatus('idle');
      } else {
        console.warn('Auto-refresh failed:', response.message);
        setAutoRefreshStatus('error');
        // Only show toast error if it's not an auth error (which is handled separately)
        if (response.status !== 401) {
          toast.error('⚠️ Unable to fetch data, retrying...');
        }
      }
    } catch (error) {
      console.error('Auto-refresh error:', error);
      setAutoRefreshStatus('error');
      toast.error('⚠️ Unable to fetch data, retrying...');
      
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
    }
  };

  // Run immediately on mount
  fetchDataInterval();
  
  // Set up interval for subsequent fetches every 5 minutes (300,000 ms)
  intervalRef.current = setInterval(fetchDataInterval, 300000);

  // Cleanup function to clear interval on unmount or when dependencies change
  return () => {
    if (intervalRef.current) {
      console.log('Clearing auto-refresh interval');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };
}, [fetchLatest, fetchHistory, fetchAlerts]);
```

#### UI Status Indicators

The UI provides clear status indicators during data fetching:

1. **Loading State**: Shows "Loading Data..." message with spinner
2. **Error State**: Shows "⚠️ Unable to fetch data, retrying..." message
3. **Success State**: Updates UI with new data without full page reload

#### Error Handling

The frontend handles various error scenarios:

1. **Network Errors**: Displays friendly error messages and continues retrying
2. **Authentication Errors**: Redirects to login when token expires
3. **API Errors**: Shows specific error messages from backend

### Backend Implementation

#### Scheduled Data Fetching

The backend uses `node-cron` to automatically fetch data every 5 minutes:

```javascript
// src/services/enhanced-sensor-data-scheduler.service.js
this.cronJob = cron.schedule('*/5 * * * *', async () => {
  logger.info('Running scheduled sensor data fetch...');
  // Check if database is connected before proceeding
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Database not connected, skipping scheduled fetch');
    return;
  }
  await this.fetchAndStoreSensorDataWithRetry();
});
```

#### Retry Mechanism

The backend implements an exponential backoff retry mechanism:

```javascript
async fetchAndStoreSensorDataWithRetry() {
  // Check if database is connected before proceeding
  if (mongoose.connection.readyState !== 1) {
    logger.warn('Database not connected, skipping fetch and retry');
    return;
  }
  
  try {
    await this.fetchAndStoreSensorData();
    // Reset retry attempts on success
    this.retryAttempts = 0;
  } catch (error) {
    this.retryAttempts++;
    logger.warn(`Sensor data fetch failed (attempt ${this.retryAttempts}/${this.maxRetries}):`, {
      message: error.message,
      stack: error.stack
    });
    
    if (this.retryAttempts < this.maxRetries) {
      // Schedule retry with exponential backoff
      const delay = this.retryDelay * Math.pow(2, this.retryAttempts - 1);
      logger.info(`Scheduling retry in ${delay}ms`);
      
      setTimeout(async () => {
        // Check if database is still connected before retrying
        if (mongoose.connection.readyState === 1) {
          await this.fetchAndStoreSensorDataWithRetry();
        } else {
          logger.warn('Database not connected, skipping retry');
        }
      }, delay);
    } else {
      logger.error('Max retry attempts reached. Giving up on sensor data fetch for this interval.', {
        retryAttempts: this.retryAttempts,
        maxRetries: this.maxRetries
      });
      this.retryAttempts = 0; // Reset for next interval
    }
  }
}
```

#### Adafruit IO Integration

The backend fetches data from Adafruit IO using their REST API:

```javascript
// src/services/adafruit.service.js
async getAllSensorData() {
  try {
    logger.info('Starting getAllSensorData function');
    const feeds = ['temperature', 'humidity', 'soil-moisture'];
    logger.info('Fetching data for feeds:', feeds);
    const data = await this.getMultipleFeedData(feeds);
    logger.info('Received data from getMultipleFeedData:', data);

    // Check if we received data for all feeds
    const missingFeeds = feeds.filter(feed => !data[feed]);
    if (missingFeeds.length > 0) {
      logger.warn('Missing data from feeds:', missingFeeds);
      throw new Error(`Missing data from feeds: ${missingFeeds.join(', ')}`);
    }

    // Parse the data
    const sensorData = {
      temperature: data.temperature ? parseFloat(data.temperature.value) : null,
      humidity: data.humidity ? parseFloat(data.humidity.value) : null,
      soilMoisture: data['soil-moisture'] ? parseFloat(data['soil-moisture'].value) : null,
      timestamp: new Date()
    };

    // Use the most recent timestamp if available
    const timestamps = [
      data.temperature?.created_at,
      data.humidity?.created_at,
      data['soil-moisture']?.created_at
    ].filter(Boolean);

    if (timestamps.length > 0) {
      const mostRecent = timestamps.reduce((latest, current) => {
        const currentDate = new Date(current);
        return currentDate > new Date(latest) ? current : latest;
      });
      sensorData.timestamp = new Date(mostRecent);
    }

    return sensorData;
  } catch (error) {
    logger.error('Error fetching all sensor data:', {
      message: error.message,
      stack: error.stack
    });
    throw new Error(`Failed to fetch sensor data from Adafruit IO: ${error.message}`);
  }
}
```

### Real-time Updates

The system uses Socket.IO for real-time updates:

1. When new data is fetched, it's broadcast to all connected clients
2. The frontend updates immediately without requiring a page refresh
3. Critical alerts (like low soil moisture) trigger immediate notifications

## Configuration

### Environment Variables

The system requires the following environment variables:

```
ADAFRUIT_IO_USERNAME=your_username
ADAFRUIT_IO_KEY=your_aio_key
ADAFRUIT_TEMP_FEED=dht-temp
ADAFRUIT_HUMIDITY_FEED=dht-hum
ADAFRUIT_SOIL_FEED=soil-moisture
```

### Feed Mapping

The system maps standard feed names to actual Adafruit feed keys:

```javascript
this.feedMapping = {
  'temperature': process.env.ADAFRUIT_TEMP_FEED || 'dht-temp',
  'humidity': process.env.ADAFRUIT_HUMIDITY_FEED || 'dht-hum',
  'soil-moisture': process.env.ADAFRUIT_SOIL_FEED || 'soil-moisture'
};
```

## Error Handling

### Frontend Error Handling

1. **Network Failures**: Displays "⚠️ Unable to fetch data, retrying..." message
2. **Authentication Errors**: Redirects to login page
3. **API Errors**: Shows specific error messages from backend

### Backend Error Handling

1. **Adafruit IO Errors**: Logs detailed error information and retries
2. **Database Errors**: Handles connection issues gracefully
3. **Validation Errors**: Returns appropriate HTTP status codes

## Performance Considerations

1. **Caching**: Uses database indexing for faster queries
2. **Connection Management**: Properly manages Socket.IO connections
3. **Memory Management**: Cleans up intervals and connections to prevent memory leaks
4. **Rate Limiting**: Respects Adafruit IO API limits

## Testing

The system has been tested for:

1. **Normal Operation**: Data fetches every 5 minutes as expected
2. **Network Failures**: Gracefully handles disconnections and retries
3. **Authentication**: Properly handles token expiration
4. **UI Updates**: Smoothly updates without full page reloads
5. **Error States**: Displays appropriate messages for various error conditions

## Future Improvements

1. **MQTT Integration**: Add support for real-time MQTT updates from Adafruit IO
2. **Advanced Analytics**: Implement more sophisticated predictive algorithms
3. **Alerting System**: Enhance notification system with email/SMS alerts
4. **Data Visualization**: Add more chart types and customization options