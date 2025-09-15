// src/components/WarehouseSearch.jsx
import React, { useState, useEffect } from 'react';
import { MapPinIcon, MagnifyingGlassIcon, FunnelIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import { getCurrentPosition, getGeolocationErrorMessage, isGeolocationSupported, isSecureContext } from '../utils/geolocation';

const WarehouseSearch = ({ onWarehouseSelect, onFilterChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    storageTypes: [],
    minPrice: '',
    maxPrice: '',
    maxDistance: 50,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);

  const storageTypes = [
    { value: 'cold-storage', label: 'Cold Storage' },
    { value: 'pest-control', label: 'Pest Control' },
    { value: 'temperature-control', label: 'Temperature Control' },
    { value: 'general', label: 'General Storage' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'frozen', label: 'Frozen Storage' }
  ];

  useEffect(() => {
    // Trigger initial search without coordinates
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getCurrentLocation = async (triggerSearch = true) => {
    setLocationLoading(true);
    setLocationError(null);

    try {
      const position = await getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      });
      
      setLocation({
        latitude: position.latitude,
        longitude: position.longitude
      });
      setLocationError(null);
      if (triggerSearch) {
        handleSearchWith({ latitude: position.latitude, longitude: position.longitude });
      }
    } catch (error) {
      console.error('Error getting location:', error);
      const errorInfo = getGeolocationErrorMessage(error);
      setLocationError(errorInfo);
      setLocation(null);
      // Fallback: trigger a search without coordinates
      if (triggerSearch) {
        handleSearchWith(null);
      }
    } finally {
      setLocationLoading(false);
    }
  };

  useEffect(() => {
    // Animate search bar on mount
    gsap.fromTo('.search-container', 
      { y: -20, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
    );
  }, []);

  const handleSearchWith = (coords) => {
    const hasCoords = coords && Number.isFinite(coords.latitude) && Number.isFinite(coords.longitude);
    const searchParams = {
      search: searchTerm,
      ...filters,
      ...(hasCoords ? { latitude: coords.latitude, longitude: coords.longitude } : {})
    };
    onFilterChange(searchParams);
  };

  const handleSearch = () => {
    handleSearchWith(location);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    const hasCoords = location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude);
    onFilterChange({ search: searchTerm, ...newFilters, ...(hasCoords ? { latitude: location.latitude, longitude: location.longitude } : {}) });
  };

  const toggleStorageType = (type) => {
    const newTypes = filters.storageTypes.includes(type)
      ? filters.storageTypes.filter(t => t !== type)
      : [...filters.storageTypes, type];
    handleFilterChange('storageTypes', newTypes);
  };

  return (
    <div className="search-container bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search warehouses by name, location, or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Location Button */}
        <button
          onClick={() => getCurrentLocation(true)}
          disabled={locationLoading}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
            locationLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {locationLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <MapPinIcon className="h-5 w-5" />
          )}
          {location ? 'Near Me' : 'Use Location'}
        </button>

        {/* Filter Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <FunnelIcon className="h-5 w-5" />
          Filters
        </button>
      </div>

      {/* Location Error Message (Compact) - removed to avoid rendering object directly */}

      {/* Advanced Filters */}
      {showFilters && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Storage Types */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Storage Types
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {storageTypes.map((type) => (
                  <label key={type.value} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.storageTypes.includes(type.value)}
                      onChange={() => toggleStorageType(type.value)}
                      className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price Range (₹/day)
              </label>
              <div className="space-y-2">
                <input
                  type="number"
                  placeholder="Min Price"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <input
                  type="number"
                  placeholder="Max Price"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Distance (km)
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={filters.maxDistance}
                onChange={(e) => handleFilterChange('maxDistance', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-gray-600 text-center">{filters.maxDistance} km</div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt">Newest First</option>
                <option value="pricing.basePrice">Price: Low to High</option>
                <option value="-pricing.basePrice">Price: High to Low</option>
                <option value="rating.average">Rating: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={() => {
                setFilters({
                  storageTypes: [],
                  minPrice: '',
                  maxPrice: '',
                  maxDistance: 50,
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                });
                setSearchTerm('');
                onFilterChange({});
              }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      {/* Location Error Display */}
      {locationError && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Location Access Issue
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                {locationError.userFriendly || locationError.message}
              </p>
              {locationError.canRetry && (
                <div className="mt-2">
                  <button
                    onClick={getCurrentLocation}
                    disabled={locationLoading}
                    className="text-sm text-yellow-800 hover:text-yellow-900 underline font-medium"
                  >
                    {locationLoading ? 'Getting location...' : 'Try again'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Geolocation Not Supported Warning */}
      {!isGeolocationSupported() && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                Location Services Not Available
              </h3>
              <p className="mt-1 text-sm text-blue-700">
                Your browser doesn't support location services. You can still search for warehouses by entering a location manually.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* HTTPS Required Warning */}
      {!isSecureContext() && (
        <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-5 w-5 text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-orange-800">
                Secure Connection Required
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                Location services require a secure connection (HTTPS). You can still search for warehouses manually.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WarehouseSearch;
