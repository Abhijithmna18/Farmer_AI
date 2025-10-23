import React, { useState, useEffect, useRef } from 'react';
import { 
  MapIcon, 
  ListBulletIcon, 
  FunnelIcon, 
  ShoppingCartIcon,
  StarIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  ClockIcon,
  ShieldCheckIcon,
  TruckIcon,
  HeartIcon,
  ShareIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon, HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { onWarehouseEvent, onBookingEvent } from '../services/realtimeClient';
import { useBookingCart } from '../context/BookingCartContext';
import WarehouseCard from '../components/WarehouseCard';
import BookingModal from '../components/BookingModal';
import WarehouseDetailsModal from '../components/WarehouseDetailsModal';
import BookingCartModal from '../components/BookingCartModal';
import { toast } from 'react-hot-toast';

const WarehouseMarketplace = () => {
  const { getCartItemCount, setIsCartOpen } = useBookingCart();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  
  // Filter and search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedStorageType, setSelectedStorageType] = useState('');
  const [priceRange, setPriceRange] = useState([0, 2000]);
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal states
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  
  // Favorites
  const [favorites, setFavorites] = useState(new Set());
  
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  // Filter options
  const cities = [
    'Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Hyderabad', 
    'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Kochi'
  ];
  
  const storageTypes = [
    { value: 'cold_storage', label: 'Cold Storage' },
    { value: 'dry_storage', label: 'Dry Storage' },
    { value: 'grain_storage', label: 'Grain Storage' },
    { value: 'refrigerated', label: 'Refrigerated' },
    { value: 'frozen', label: 'Frozen' },
    { value: 'ambient', label: 'Ambient' },
    { value: 'controlled_atmosphere', label: 'Controlled Atmosphere' }
  ];
  
  const facilities = [
    'security', 'cctv', 'fire_safety', 'loading_dock', 
    'forklift', 'temperature_control', 'humidity_control', 
    'pest_control', 'insurance'
  ];

  useEffect(() => {
    fetchWarehouses();
  }, [pagination.current, searchQuery, selectedCity, selectedStorageType, priceRange, selectedFacilities, sortBy, sortOrder]);

  useEffect(() => {
    // Animate cards when warehouses change
    if (warehouses.length > 0) {
      gsap.fromTo(cardsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [warehouses]);

  // Realtime: refetch when warehouses are created/updated/deleted or bookings affect availability
  useEffect(() => {
    const offWh = onWarehouseEvent((evt) => {
      fetchWarehouses();
    });
    const offBk = onBookingEvent((evt) => {
      // Booking payment/approval can change capacity/availability visibility
      fetchWarehouses();
    });
    return () => {
      offWh && offWh();
      offBk && offBk();
    };
  }, []);

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        search: searchQuery,
        city: selectedCity,
        storageTypes: selectedStorageType,
        minPrice: priceRange[0],
        maxPrice: priceRange[1],
        facilities: selectedFacilities.join(','),
        sortBy,
        sortOrder
      });

      // Remove empty values
      Array.from(queryParams.entries()).forEach(([key, value]) => {
        if (!value || value === 'undefined' || value === 'null') {
          queryParams.delete(key);
        }
      });

      const response = await apiClient.get(`/warehouses?${queryParams}`);
      const data = response.data;

      if (data.success) {
        setWarehouses(data.data || []);
        setPagination(data.pagination || {
          current: 1,
          pages: 1,
          total: 0
        });
      } else {
        setError(data.message || 'Failed to fetch warehouses');
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err);
      setError(err.response?.data?.message || 'Failed to fetch warehouses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBookWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowBookingModal(true);
  };

  const handleViewDetails = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetailsModal(true);
  };

  const handleToggleFavorite = (warehouseId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(warehouseId)) {
      newFavorites.delete(warehouseId);
      toast.success('Removed from favorites');
    } else {
      newFavorites.add(warehouseId);
      toast.success('Added to favorites');
    }
    setFavorites(newFavorites);
  };

  const handleShareWarehouse = async (warehouse) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: warehouse.name,
          text: warehouse.description,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'city':
        setSelectedCity(value);
        break;
      case 'storageType':
        setSelectedStorageType(value);
        break;
      case 'facility':
        const newFacilities = selectedFacilities.includes(value)
          ? selectedFacilities.filter(f => f !== value)
          : [...selectedFacilities, value];
        setSelectedFacilities(newFacilities);
        break;
      case 'priceRange':
        setPriceRange(value);
        break;
      default:
        break;
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCity('');
    setSelectedStorageType('');
    setPriceRange([0, 2000]);
    setSelectedFacilities([]);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden animate-pulse">
          <div className="h-48 bg-gray-300"></div>
          <div className="p-6">
            <div className="h-6 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-4"></div>
            <div className="h-4 bg-gray-300 rounded mb-2"></div>
            <div className="h-4 bg-gray-300 rounded mb-4"></div>
            <div className="flex gap-2">
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
              <div className="h-10 bg-gray-300 rounded flex-1"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderPagination = () => {
    if (pagination.pages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, pagination.current - 2);
    const endPage = Math.min(pagination.pages, pagination.current + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 rounded-lg ${
            i === pagination.current
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 mt-8">
        <button
          onClick={() => handlePageChange(pagination.current - 1)}
          disabled={pagination.current === 1}
          className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        {pages}
        <button
          onClick={() => handlePageChange(pagination.current + 1)}
          disabled={pagination.current === pagination.pages}
          className="px-3 py-2 rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-800 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Find Your Perfect Storage Solution
            </h1>
            <p className="text-xl mb-8 text-green-100">
              Discover premium warehouses and cold storage facilities across India. 
              Book with confidence and store your agricultural produce safely.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search warehouses by name, location, or storage type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-lg text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-green-300 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Header with Cart */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {loading ? 'Loading...' : `${pagination.total} warehouses available`}
            </h2>
            <p className="text-gray-600">Find the perfect storage solution for your needs</p>
          </div>
          
          {/* Cart Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg"
          >
            <ShoppingCartIcon className="h-5 w-5" />
            <span>My Cart</span>
            {getCartItemCount() > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold">
                {getCartItemCount()}
              </span>
            )}
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Filter Toggle */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <FunnelIcon className="h-5 w-5" />
                Filters
              </button>
              
              {/* Quick Filters */}
              <div className="flex gap-2">
                <select
                  value={selectedCity}
                  onChange={(e) => handleFilterChange('city', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Cities</option>
                  {cities.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
                
                <select
                  value={selectedStorageType}
                  onChange={(e) => handleFilterChange('storageType', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">All Storage Types</option>
                  {storageTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort and View Controls */}
            <div className="flex items-center gap-4">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="pricing.basePrice-asc">Price: Low to High</option>
                <option value="pricing.basePrice-desc">Price: High to Low</option>
                <option value="rating.average-desc">Rating: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'grid' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <MapIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${
                    viewMode === 'list' ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <ListBulletIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range (₹/day)
                  </label>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      step="50"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>₹{priceRange[0]}</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                  </div>
                </div>

                {/* Facilities */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facilities
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {facilities.map(facility => (
                      <label key={facility} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedFacilities.includes(facility)}
                          onChange={() => handleFilterChange('facility', facility)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700 capitalize">
                          {facility.replace('_', ' ')}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && renderLoadingSkeleton()}

        {/* Results */}
        {!loading && !error && (
          <>
            {warehouses.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🏭</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No warehouses found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your filters or search terms</p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-6 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {warehouses.map((warehouse, index) => (
                    <div
                      key={warehouse._id}
                      ref={el => cardsRef.current[index] = el}
                    >
                      <WarehouseCard
                        warehouse={warehouse}
                        onBook={handleBookWarehouse}
                        onViewDetails={handleViewDetails}
                        isFavorited={favorites.has(warehouse._id)}
                        onToggleFavorite={() => handleToggleFavorite(warehouse._id)}
                        onShare={() => handleShareWarehouse(warehouse)}
                        viewMode={viewMode}
                      />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {renderPagination()}
              </>
            )}
          </>
        )}

        {/* Modals */}
        {selectedWarehouse && (
          <>
            <BookingModal
              isOpen={showBookingModal}
              onClose={() => setShowBookingModal(false)}
              warehouse={selectedWarehouse}
              onBook={(bookingData) => {
                console.log('Booking data:', bookingData);
                setShowBookingModal(false);
                toast.success('Booking created successfully!');
              }}
            />
            <WarehouseDetailsModal
              isOpen={showDetailsModal}
              onClose={() => setShowDetailsModal(false)}
              warehouse={selectedWarehouse}
              onBook={handleBookWarehouse}
            />
          </>
        )}
        
        {/* Cart Modal */}
        <BookingCartModal />
      </div>
    </div>
  );
};

export default WarehouseMarketplace;