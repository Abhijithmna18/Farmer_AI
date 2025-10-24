// src/pages/FarmerDashboard.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  CalendarIcon, 
  CurrencyRupeeIcon, 
  MapPinIcon, 
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';

const FarmerDashboard = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showBookingDetails, setShowBookingDetails] = useState(false);
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    totalSpent: 0
  });
  
  const containerRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    fetchBookings();
    fetchStats();
  }, []);

  useEffect(() => {
    // Animate cards when bookings change
    if (bookings.length > 0) {
      gsap.fromTo(cardsRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [bookings]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/warehouse-bookings/my-bookings');
      if (data?.success) {
        setBookings(data.data);
      } else {
        setError(data?.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await apiClient.get('/warehouses/stats/bookings');
      if (data?.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowBookingDetails(true);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const { data } = await apiClient.post(`/warehouse-bookings/${bookingId}/cancel`, { reason: 'Cancelled by farmer' });
      if (data?.success) {
        fetchBookings();
        fetchStats();
      } else {
        alert(data?.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
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
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5" />;
      case 'awaiting-approval':
        return <ClockIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XMarkIcon className="h-5 w-5" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const canCancelBooking = (booking) => {
    return booking.status === 'paid' && 
           new Date(booking.bookingDates.startDate) > new Date(Date.now() + 24 * 60 * 60 * 1000);
  };

  const renderBookingCard = (booking, index) => (
    <div
      key={booking._id}
      ref={el => cardsRef.current[index] = el}
      className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{booking.warehouse?.name || 'Unknown Warehouse'}</h3>
          <p className="text-sm text-gray-600">
            {booking.warehouse?.location?.city || 'Unknown City'}, {booking.warehouse?.location?.state || 'Unknown State'}
          </p>
        </div>
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
          {getStatusIcon(booking.status)}
          <span>{booking.status.replace('-', ' ').toUpperCase()}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Produce</p>
          <p className="font-medium">{booking.produce.type} ({booking.produce.quantity} {booking.produce.unit})</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Storage Period</p>
          <p className="font-medium">
            {formatDate(booking.bookingDates.startDate)} - {formatDate(booking.bookingDates.endDate)}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Amount</p>
          <p className="font-medium text-green-600 flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
            {booking.pricing.totalAmount}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Booking ID</p>
          <p className="font-medium text-gray-900">{booking.bookingId}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => handleViewDetails(booking)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <EyeIcon className="h-4 w-4" />
          View Details
        </button>
        {canCancelBooking(booking) && (
          <button
            onClick={() => handleCancelBooking(booking._id)}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
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
          <div className="flex gap-2">
            <div className="h-10 bg-gray-300 rounded flex-1"></div>
            <div className="h-10 bg-gray-300 rounded w-20"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Manage your warehouse bookings and storage history</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <CheckCircleIcon className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircleIcon className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.completedBookings}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CurrencyRupeeIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Spent</p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.totalSpent}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-600">
                <ExclamationTriangleIcon className="h-5 w-5" />
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

        {/* Bookings */}
        {!loading && !error && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
                <p className="text-gray-600 mb-4">
                  You haven't made any warehouse bookings yet
                </p>
                <a
                  href="/warehouses"
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Browse Warehouses
                </a>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking, index) => renderBookingCard(booking, index))}
              </div>
            )}
          </>
        )}

        {/* Booking Details Modal */}
        {selectedBooking && showBookingDetails && (
          <BookingDetailsModal
            booking={selectedBooking}
            onClose={() => setShowBookingDetails(false)}
            onCancel={handleCancelBooking}
          />
        )}
      </div>
    </div>
  );
};

// Booking Details Modal Component
const BookingDetailsModal = ({ booking, onClose, onCancel }) => {
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

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-blue-100 text-blue-800',
      'awaiting-approval': 'bg-orange-100 text-orange-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold text-gray-900">Booking Details</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Booking #{booking.bookingId}</h3>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Created:</p>
                <p className="font-medium">{formatDate(booking.createdAt)}</p>
              </div>
              <div>
                <p className="text-gray-600">Duration:</p>
                <p className="font-medium">{booking.bookingDates.duration} days</p>
              </div>
            </div>
          </div>

          {/* Warehouse Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Warehouse Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <MapPinIcon className="h-4 w-4 text-gray-400" />
                <span className="font-medium">{booking.warehouse?.name || 'Unknown Warehouse'}</span>
              </div>
              <p className="text-gray-600 text-sm ml-6">
                {booking.warehouse?.location?.city || 'Unknown City'}, {booking.warehouse?.location?.state || 'Unknown State'}
              </p>
            </div>
          </div>

          {/* Produce Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Produce Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Type:</p>
                  <p className="font-medium">{booking.produce.type}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quantity:</p>
                  <p className="font-medium">{booking.produce.quantity} {booking.produce.unit}</p>
                </div>
                <div>
                  <p className="text-gray-600">Quality:</p>
                  <p className="font-medium capitalize">{booking.produce.quality}</p>
                </div>
                <div>
                  <p className="text-gray-600">Storage Type:</p>
                  <p className="font-medium">{booking.storageRequirements.storageType}</p>
                </div>
              </div>
              {booking.produce.description && (
                <div>
                  <p className="text-gray-600 text-sm">Description:</p>
                  <p className="text-sm">{booking.produce.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Dates */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Storage Period</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">Start Date</p>
                    <p className="font-medium">{formatDate(booking.bookingDates.startDate)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-600">End Date</p>
                    <p className="font-medium">{formatDate(booking.bookingDates.endDate)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-medium">₹{booking.pricing.basePrice}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Platform Fee:</span>
                <span className="font-medium">₹{booking.pricing.platformFee}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="font-bold text-green-600">₹{booking.pricing.totalAmount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.payment.status)}`}>
                  {booking.payment.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Communication */}
          {booking.communication && booking.communication.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Communication</h3>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {booking.communication.map((msg, index) => (
                  <div key={index} className="bg-gray-50 rounded p-3">
                    <p className="text-sm text-gray-600">{msg.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(msg.timestamp).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-4 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
          {booking.status === 'paid' && new Date(booking.bookingDates.startDate) > new Date(Date.now() + 24 * 60 * 60 * 1000) && (
            <button
              onClick={() => {
                onCancel(booking._id);
                handleClose();
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FarmerDashboard;























