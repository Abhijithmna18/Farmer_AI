// src/pages/AdminWarehouseDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  CurrencyRupeeIcon,
  MapPinIcon,
  CalendarIcon,
  ChartBarIcon,
  UsersIcon,
  BuildingOfficeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';

const AdminWarehouseDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [bookings, setBookings] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalWarehouses: 0,
    totalPayments: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    activeWarehouses: 0
  });
  
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    // Animate cards when data changes
    if (cardsRef.current.length > 0) {
      gsap.fromTo(cardsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [bookings, warehouses, payments]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'bookings') {
        await fetchBookings();
      } else if (activeTab === 'warehouses') {
        await fetchWarehouses();
      } else if (activeTab === 'payments') {
        await fetchPayments();
      }
      
      await fetchStats();
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const response = await apiClient.get('/admin/bookings');
      const data = response.data;

      if (data.success) {
        setBookings(data.data);
      } else {
        setError(data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('Error fetching bookings:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await apiClient.get('/admin/warehouses');
      const data = response.data;

      if (data.success) {
        setWarehouses(data.data);
      } else {
        setError(data.message || 'Failed to fetch warehouses');
      }
    } catch (err) {
      setError('Failed to fetch warehouses');
      console.error('Error fetching warehouses:', err);
    }
  };

  const fetchPayments = async () => {
    try {
      const response = await apiClient.get('/admin/payments');
      const data = response.data;

      if (data.success) {
        setPayments(data.data);
      } else {
        setError(data.message || 'Failed to fetch payments');
      }
    } catch (err) {
      setError('Failed to fetch payments');
      console.error('Error fetching payments:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const [bookingsRes, warehousesRes, paymentsRes] = await Promise.all([
        apiClient.get('/admin/analytics/bookings'),
        apiClient.get('/admin/analytics/warehouses'),
        apiClient.get('/admin/analytics/payments')
      ]);

      const [bookingsData, warehousesData, paymentsData] = [
        bookingsRes.data,
        warehousesRes.data,
        paymentsRes.data
      ];

      if (bookingsData.success && warehousesData.success && paymentsData.success) {
        setStats({
          totalBookings: bookingsData.data.totalBookings || 0,
          totalWarehouses: warehousesData.data.totalWarehouses || 0,
          totalPayments: paymentsData.data.totalPayments || 0,
          totalRevenue: paymentsData.data.totalAmount || 0,
          pendingBookings: bookingsData.data.pendingBookings || 0,
          activeWarehouses: warehousesData.data.activeWarehouses || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleViewDetails = (item, type) => {
    setSelectedItem({ ...item, type });
    setShowDetailsModal(true);
  };

  const handleVerifyWarehouse = async (warehouseId, status) => {
    try {
      const response = await apiClient.patch(`/admin/warehouses/${warehouseId}/verify`, {
        status, 
        notes: `Verified by admin - ${status}` 
      });

      const data = response.data;

      if (data.success) {
        fetchWarehouses();
        fetchStats();
      } else {
        alert(data.message || 'Failed to update warehouse verification');
      }
    } catch (error) {
      console.error('Error updating warehouse:', error);
      alert('Network error. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-blue-100 text-blue-800',
      'awaiting-approval': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-red-100 text-red-800',
      'verified': 'bg-green-100 text-green-800',
      'unverified': 'bg-yellow-100 text-yellow-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const renderBookingCard = (booking, index) => (
    <div
      key={booking._id}
      ref={el => cardsRef.current[index] = el}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">#{booking.bookingId}</h3>
          <p className="text-sm text-gray-600">
            {booking.farmer.firstName} {booking.farmer.lastName} → {booking.warehouse.name}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {booking.status.replace('-', ' ').toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Produce</p>
          <p className="font-medium">{booking.produce.type} ({booking.produce.quantity} {booking.produce.unit})</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium text-green-600 flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
            {booking.pricing.totalAmount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Storage Period</p>
          <p className="font-medium">
            {formatDate(booking.bookingDates.startDate)} - {formatDate(booking.bookingDates.endDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Created</p>
          <p className="font-medium">{formatDate(booking.createdAt)}</p>
        </div>
      </div>

      <button
        onClick={() => handleViewDetails(booking, 'booking')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <EyeIcon className="h-4 w-4" />
        View Details
      </button>
    </div>
  );

  const renderWarehouseCard = (warehouse, index) => (
    <div
      key={warehouse._id}
      ref={el => cardsRef.current[index] = el}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{warehouse.name}</h3>
          <p className="text-sm text-gray-600 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {warehouse.location.city}, {warehouse.location.state}
          </p>
        </div>
        <div className="flex gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warehouse.status)}`}>
            {warehouse.status.toUpperCase()}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warehouse.verification.status)}`}>
            {warehouse.verification.status.toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Owner</p>
          <p className="font-medium">{warehouse.owner.firstName} {warehouse.owner.lastName}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price/Day</p>
          <p className="font-medium text-green-600 flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
            {warehouse.pricing.basePrice}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Capacity</p>
          <p className="font-medium">{warehouse.capacity.available} {warehouse.capacity.unit}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Bookings</p>
          <p className="font-medium">{warehouse.bookings.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleViewDetails(warehouse, 'warehouse')}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <EyeIcon className="h-4 w-4" />
          View Details
        </button>
        {warehouse.verification.status === 'pending' && (
          <>
            <button
              onClick={() => handleVerifyWarehouse(warehouse._id, 'verified')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircleIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleVerifyWarehouse(warehouse._id, 'rejected')}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              <XCircleIcon className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </div>
  );

  const renderPaymentCard = (payment, index) => (
    <div
      key={payment._id}
      ref={el => cardsRef.current[index] = el}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">#{payment.paymentId}</h3>
          <p className="text-sm text-gray-600">
            {payment.farmer.firstName} {payment.farmer.lastName} → {payment.warehouseOwner.firstName} {payment.warehouseOwner.lastName}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {payment.status.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Amount</p>
          <p className="font-medium text-green-600 flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
            {payment.amount.total}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Platform Fee</p>
          <p className="font-medium">{payment.amount.platformFee}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Owner Amount</p>
          <p className="font-medium">{payment.amount.ownerAmount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Date</p>
          <p className="font-medium">{formatDate(payment.createdAt)}</p>
        </div>
      </div>

      <button
        onClick={() => handleViewDetails(payment, 'payment')}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
      >
        <EyeIcon className="h-4 w-4" />
        View Details
      </button>
    </div>
  );

  const renderLoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
            <div className="h-6 bg-gray-300 rounded w-20"></div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded"></div>
          </div>
          <div className="h-10 bg-gray-300 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Warehouse Management</h1>
          <p className="text-gray-600">Admin dashboard for warehouse and booking management</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CalendarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <BuildingOfficeIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalWarehouses}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CurrencyRupeeIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <ClockIcon className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pending Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Warehouses</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeWarehouses}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'overview'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('bookings')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'bookings'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Bookings
              </button>
              <button
                onClick={() => setActiveTab('warehouses')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'warehouses'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Warehouses
              </button>
              <button
                onClick={() => setActiveTab('payments')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'payments'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Payments
              </button>
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600">
                <XCircleIcon className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading && renderLoadingSkeleton()}

        {!loading && !error && (
          <>
            {activeTab === 'overview' && (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Overview Dashboard</h3>
                <p className="text-gray-600">
                  Detailed analytics and charts will be available soon
                </p>
              </div>
            )}

            {activeTab === 'bookings' && (
              <>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600">No booking data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking, index) => renderBookingCard(booking, index))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'warehouses' && (
              <>
                {warehouses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏭</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No warehouses found</h3>
                    <p className="text-gray-600">No warehouse data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {warehouses.map((warehouse, index) => renderWarehouseCard(warehouse, index))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'payments' && (
              <>
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments found</h3>
                    <p className="text-gray-600">No payment data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((payment, index) => renderPaymentCard(payment, index))}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Details Modal */}
        {selectedItem && showDetailsModal && (
          <DetailsModal
            item={selectedItem}
            onClose={() => setShowDetailsModal(false)}
          />
        )}
      </div>
    </div>
  );
};

// Details Modal Component
const DetailsModal = ({ item, onClose }) => {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);

  useEffect(() => {
    // Animate modal in
    gsap.fromTo(backdropRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 0.3 }
    );
    gsap.fromTo(modalRef.current,
      { y: 50, opacity: 0, scale: 0.95 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: 'power2.out' }
    );
  }, []);

  const handleClose = () => {
    gsap.to(backdropRef.current, { opacity: 0, duration: 0.2 });
    gsap.to(modalRef.current, 
      { y: 50, opacity: 0, scale: 0.95, duration: 0.3, ease: 'power2.in' },
      () => onClose()
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {item.type === 'booking' ? 'Booking' : item.type === 'warehouse' ? 'Warehouse' : 'Payment'} Details
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XCircleIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <pre className="text-sm text-gray-600 overflow-auto">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminWarehouseDashboard;
