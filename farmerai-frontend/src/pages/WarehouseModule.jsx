// src/pages/WarehouseModule.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapIcon, ListBulletIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import useAuth from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import { useBookingCart } from '../context/BookingCartContext';
import WarehouseSearch from '../components/WarehouseSearch';
import WarehouseFilters from '../components/WarehouseFilters';
import WarehouseGrid from '../components/WarehouseGrid';
import BookingModal from '../components/BookingModal';
import WarehouseDetailsModal from '../components/WarehouseDetailsModal';
import BookingCartModal from '../components/BookingCartModal';
import BookingForm from '../components/BookingForm';

const WarehouseModule = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getCartItemCount, setIsCartOpen } = useBookingCart();
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({});
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const containerRef = React.useRef(null);
  const cardsRef = React.useRef([]);

  useEffect(() => {
    fetchWarehouses();
  }, [filters, pagination.current]); // Keep dependencies as they are needed

  useEffect(() => {
    // Animate cards when warehouses change
    if (warehouses.length > 0 && cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [warehouses.length]); // Only depend on length, not the entire array

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams({
        page: pagination.current,
        limit: 12,
        ...filters
      });

      // Remove undefined or empty values
      Array.from(queryParams.entries()).forEach(([key, value]) => {
        if (!value || value === 'undefined' || value === 'null') {
          queryParams.delete(key);
        }
      });

      console.log('Fetching warehouses with params:', Object.fromEntries(queryParams));

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
      
      // Handle different types of errors
      if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.response?.status === 400) {
        setError('Invalid search parameters. Please check your filters.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('Network error. Please check your internet connection.');
      } else {
        setError(err.response?.data?.message || 'Failed to fetch warehouses. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, current: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBookWarehouse = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowBookingModal(true);
  };

  const handleViewDetails = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowDetailsModal(true);
  };

  const handleBookingSubmit = async (bookingData) => {
    try {
      const response = await apiClient.post('/bookings', bookingData);

      if (response.data.success) {
        console.log('Booking created:', response.data.data);
        setShowBookingModal(false);
        // Show success message and redirect to my bookings
        navigate('/dashboard/my-bookings');
      } else {
        console.error('Booking failed:', response.data.message);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleSortChange = (newSortBy) => {
    const newSortOrder = sortBy === newSortBy 
      ? (sortOrder === 'asc' ? 'desc' : 'asc')
      : 'desc';
    
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: newSortOrder
    }));
  };

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


  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">Storage Marketplace</h1>
                  <p className="text-gray-600 text-lg">
                    Find the perfect storage solution for your agricultural produce
                  </p>
                </div>
              </div>
              
              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-green-600">{pagination.total}</div>
                  <div className="text-sm text-gray-600">Available Warehouses</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-blue-600">24/7</div>
                  <div className="text-sm text-gray-600">Customer Support</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-purple-600">100%</div>
                  <div className="text-sm text-gray-600">Secure Storage</div>
                </div>
                <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                  <div className="text-2xl font-bold text-orange-600">₹50</div>
                  <div className="text-sm text-gray-600">Starting Price/Day</div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* My Bookings Button */}
              <button
                onClick={() => navigate('/dashboard/my-bookings')}
                className="px-6 py-3 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                My Bookings
              </button>
              
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium shadow-lg hover:shadow-xl"
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
          </div>
        </div>

        {/* Search and Filters */}
        <WarehouseFilters onChange={handleFilterChange} initial={filters} />

        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900">
                {loading ? 'Loading...' : `${pagination.total} storage facilities available`}
              </h2>
              
              {!loading && warehouses.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>•</span>
                  <span>Starting from ₹{Math.min(...warehouses.map(w => w.pricing?.basePrice || 0))}/day</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Sort Options */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={`${sortBy}-${sortOrder}`}
                  onChange={(e) => {
                    const [newSortBy, newSortOrder] = e.target.value.split('-');
                    setSortBy(newSortBy);
                    setSortOrder(newSortOrder);
                    handleFilterChange({ ...filters, sortBy: newSortBy, sortOrder: newSortOrder });
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                >
                  <option value="createdAt-desc">Newest First</option>
                  <option value="pricing.basePrice-asc">Price: Low to High</option>
                  <option value="pricing.basePrice-desc">Price: High to Low</option>
                  <option value="rating.average-desc">Rating: High to Low</option>
                  <option value="name-asc">Name: A to Z</option>
                  <option value="capacity.total-desc">Capacity: High to Low</option>
                </select>
              </div>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Grid View"
                >
                  <MapIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="List View"
                >
                  <ListBulletIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-red-800">Unable to load storage facilities</h3>
                <p className="text-red-600 mt-2">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={() => fetchWarehouses()}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="space-y-6">
            <div className="text-center py-8">
              <div className="inline-flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-600"></div>
                <span>Finding the best storage solutions for you...</span>
              </div>
            </div>
            {renderLoadingSkeleton()}
          </div>
        )}

        {/* Results */}
        {!loading && !error && warehouses.length > 0 && (
          <>
            <WarehouseGrid
              warehouses={warehouses}
              onBook={handleBookWarehouse}
              onViewDetails={handleViewDetails}
            />

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {/* Empty State */}
        {!loading && !error && warehouses.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">🏭</div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No storage facilities found</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              We couldn't find any storage facilities matching your criteria. Try adjusting your search filters or check back later for new listings.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleFilterChange({})}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                Clear All Filters
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

        {/* Modals */}
        {selectedWarehouse && (
          <>
            <BookingForm
              isOpen={showBookingModal}
              onClose={() => setShowBookingModal(false)}
              warehouse={selectedWarehouse}
              onBook={handleBookingSubmit}
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

export default WarehouseModule;
