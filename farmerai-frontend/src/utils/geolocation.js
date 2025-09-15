// src/utils/geolocation.js
/**
 * Geolocation utility with comprehensive error handling
 * Handles all geolocation errors gracefully and provides fallbacks
 */

export const GEOLOCATION_ERRORS = {
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  POSITION_UNAVAILABLE: 'POSITION_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
  NOT_SUPPORTED: 'NOT_SUPPORTED',
  SECURE_CONTEXT_REQUIRED: 'SECURE_CONTEXT_REQUIRED'
};

export const getGeolocationErrorMessage = (error) => {
  switch (error.code) {
    case 1: // PERMISSION_DENIED
      return {
        type: GEOLOCATION_ERRORS.PERMISSION_DENIED,
        message: 'Location access denied. You can still search by entering a location manually.',
        userFriendly: 'Location access denied. Please enable location permissions or search manually.',
        canRetry: true
      };
    case 2: // POSITION_UNAVAILABLE
      return {
        type: GEOLOCATION_ERRORS.POSITION_UNAVAILABLE,
        message: 'Location information unavailable. Please try again or search manually.',
        userFriendly: 'Unable to determine your location. Please try again or search manually.',
        canRetry: true
      };
    case 3: // TIMEOUT
      return {
        type: GEOLOCATION_ERRORS.TIMEOUT,
        message: 'Location request timed out. Please try again or search manually.',
        userFriendly: 'Location request timed out. Please try again or search manually.',
        canRetry: true
      };
    default:
      return {
        type: 'UNKNOWN',
        message: 'An unknown error occurred while getting location.',
        userFriendly: 'Unable to get your location. Please search manually.',
        canRetry: true
      };
  }
};

export const isGeolocationSupported = () => {
  return 'geolocation' in navigator;
};

export const isSecureContext = () => {
  return window.isSecureContext || window.location.protocol === 'https:';
};

export const getCurrentPosition = (options = {}) => {
  return new Promise((resolve, reject) => {
    // Check if geolocation is supported
    if (!isGeolocationSupported()) {
      const error = new Error('Geolocation is not supported by this browser.');
      error.code = GEOLOCATION_ERRORS.NOT_SUPPORTED;
      reject(error);
      return;
    }

    // Check if we're in a secure context (required for geolocation)
    if (!isSecureContext()) {
      const error = new Error('Geolocation requires a secure context (HTTPS).');
      error.code = GEOLOCATION_ERRORS.SECURE_CONTEXT_REQUIRED;
      reject(error);
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    const geolocationOptions = { ...defaultOptions, ...options };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        });
      },
      (error) => {
        console.error('Geolocation error:', error);
        reject(error);
      },
      geolocationOptions
    );
  });
};

export const watchPosition = (onSuccess, onError, options = {}) => {
  if (!isGeolocationSupported()) {
    const error = new Error('Geolocation is not supported by this browser.');
    error.code = GEOLOCATION_ERRORS.NOT_SUPPORTED;
    onError(error);
    return null;
  }

  if (!isSecureContext()) {
    const error = new Error('Geolocation requires a secure context (HTTPS).');
    error.code = GEOLOCATION_ERRORS.SECURE_CONTEXT_REQUIRED;
    onError(error);
    return null;
  }

  const defaultOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 300000
  };

  const geolocationOptions = { ...defaultOptions, ...options };

  return navigator.geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp
      });
    },
    (error) => {
      console.error('Geolocation watch error:', error);
      onError(error);
    },
    geolocationOptions
  );
};

export const clearWatch = (watchId) => {
  if (watchId && navigator.geolocation) {
    navigator.geolocation.clearWatch(watchId);
  }
};

// Hook for React components
export const useGeolocation = (options = {}) => {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const getLocation = async () => {
    setLoading(true);
    setError(null);

    try {
      const position = await getCurrentPosition(options);
      setLocation(position);
      setError(null);
    } catch (err) {
      const errorInfo = getGeolocationErrorMessage(err);
      setError(errorInfo);
      setLocation(null);
    } finally {
      setLoading(false);
    }
  };

  const clearLocation = () => {
    setLocation(null);
    setError(null);
  };

  return {
    location,
    error,
    loading,
    getLocation,
    clearLocation,
    isSupported: isGeolocationSupported(),
    isSecure: isSecureContext()
  };
};




