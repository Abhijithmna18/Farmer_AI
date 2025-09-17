// src/pages/WarehouseListing.jsx
import React, { useState, useEffect, useRef } from 'react';
import { MapIcon, ListBulletIcon, FunnelIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { useBookingCart } from '../context/BookingCartContext';
import WarehouseSearch from '../components/WarehouseSearch';
import WarehouseFilters from '../components/WarehouseFilters';
import WarehouseGrid from '../components/WarehouseGrid';
import BookingModal from '../components/BookingModal';
import WarehouseDetailsModal from '../components/WarehouseDetailsModal';
import BookingCartModal from '../components/BookingCartModal';

const WarehouseListing = () => {
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
  
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    fetchWarehouses();
  }, [filters, pagination.current]);

  useEffect(() => {
    // Animate cards when warehouses change
    if (warehouses.length > 0) {
      gsap.fromTo(cardsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [warehouses]);

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
      const response = await fetch('/api/warehouses/book', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(bookingData)
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to payment or show success message
        console.log('Booking created:', data.data);
        setShowBookingModal(false);
        // Handle payment flow here
      } else {
        console.error('Booking failed:', data.message);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
    }
  };

  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
    
    setFilters(prev => ({
      ...prev,
      sortBy: newSortBy,
      sortOrder: sortOrder === 'asc' ? 'desc' : 'asc'
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
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Find Storage Solutions</h1>
              <p className="text-gray-600">
                Discover warehouses and cold storage facilities near you for your agricultural produce
              </p>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <ShoppingCartIcon className="h-5 w-5" />
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <WarehouseFilters onChange={handleFilterChange} initial={filters} />

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="flex items-center gap-4 mb-4 sm:mb-0">
            <h2 className="text-xl font-semibold text-gray-900">
              {loading ? 'Loading...' : `${pagination.total} warehouses found`}
            </h2>
            
            {/* Sort Options */}
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                handleFilterChange({ ...filters, sortBy: newSortBy, sortOrder: newSortOrder });
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="pricing.basePrice-asc">Price: Low to High</option>
              <option value="pricing.basePrice-desc">Price: High to Low</option>
              <option value="rating.average-desc">Rating: High to Low</option>
              <option value="name-asc">Name: A to Z</option>
            </select>
          </div>

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
            <WarehouseGrid
              warehouses={warehouses}
              onBook={handleBookWarehouse}
              onViewDetails={handleViewDetails}
            />

            {/* Pagination */}
            {renderPagination()}
          </>
        )}

        {/* Modals */}
        {selectedWarehouse && (
          <>
            <BookingModal
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

export default WarehouseListing;
