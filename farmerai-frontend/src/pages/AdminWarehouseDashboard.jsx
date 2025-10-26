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
import { toast } from 'react-hot-toast';
import OverviewDashboard from '../components/admin/OverviewDashboard';
// Safe import of realtime client
import { onWarehouseEvent, onBookingEvent } from '../services/realtimeClient';

const AdminWarehouseDashboard = ({ initialTab = 'overview' }) => {
  console.log('AdminWarehouseDashboard rendering, initialTab:', initialTab);
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [bookings, setBookings] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [payments, setPayments] = useState([]);
  const [hasError, setHasError] = useState(false);
  
  // Warehouses filters/pagination
  const [whStatus, setWhStatus] = useState(''); // '', 'active', 'inactive', 'draft', 'maintenance', 'suspended'
  const [whVerified, setWhVerified] = useState(''); // '', 'verified', 'pending', 'rejected'
  const [whPage, setWhPage] = useState(1);
  const [whPages, setWhPages] = useState(1);
  const [whTotal, setWhTotal] = useState(0);
  const [whLimit, setWhLimit] = useState(9);
  // Bookings filters/pagination
  const [bkStatus, setBkStatus] = useState(''); // '', 'pending', 'awaiting-approval','approved','rejected','cancelled','completed'
  const [bkPage, setBkPage] = useState(1);
  const [bkPages, setBkPages] = useState(1);
  const [bkTotal, setBkTotal] = useState(0);
  const [bkLimit, setBkLimit] = useState(9);
  // Payments filters/pagination
  const [payStatus, setPayStatus] = useState(''); // '', 'completed','refunded','failed','pending'
  const [payPage, setPayPage] = useState(1);
  const [payPages, setPayPages] = useState(1);
  const [payTotal, setPayTotal] = useState(0);
  const [payLimit, setPayLimit] = useState(9);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [actionLoading, setActionLoading] = useState({}); // bookingId -> boolean
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
    try {
      fetchData();
    } catch (error) {
      console.error('Error in fetchData useEffect:', error);
      setHasError(true);
    }
  }, [activeTab]);

  // Realtime: refresh the currently active tab when events occur
  useEffect(() => {
    const offWh = onWarehouseEvent((evt) => {
      if (activeTab === 'warehouses') {
        fetchWarehouses();
      }
      // Stats may also change
      fetchStats();
    });
    const offBk = onBookingEvent((evt) => {
      if (activeTab === 'bookings') {
        fetchBookings();
      }
      // Payments and stats can be affected
      if (activeTab === 'payments') {
        fetchPayments();
      }
      fetchStats();
    });
    return () => {
      offWh && offWh();
      offBk && offBk();
    };
  }, [activeTab]);

  useEffect(() => {
    // Listen for verification events from the modal
    const handleModalVerifyWarehouse = (event) => {
      const { warehouseId, status } = event.detail;
      handleVerifyWarehouse(warehouseId, status);
    };

    window.addEventListener('verifyWarehouse', handleModalVerifyWarehouse);
    return () => window.removeEventListener('verifyWarehouse', handleModalVerifyWarehouse);
  }, []);

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
      const params = new URLSearchParams();
      params.set('page', String(bkPage));
      params.set('limit', String(bkLimit));
      if (bkStatus) params.set('status', bkStatus);
      const response = await apiClient.get(`/admin/bookings?${params.toString()}`);
      const data = response.data;

      if (data.success) {
        setBookings(data.data);
        if (data.pagination) {
          setBkPage(data.pagination.current || 1);
          setBkPages(data.pagination.pages || 1);
          setBkTotal(data.pagination.total || 0);
        }
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
      const params = new URLSearchParams();
      params.set('page', String(whPage));
      params.set('limit', String(whLimit));
      if (whStatus) params.set('status', whStatus);
      if (whVerified) params.set('verified', whVerified);
      const response = await apiClient.get(`/admin/warehouses?${params.toString()}`);
      const data = response.data;

      if (data.success) {
        setWarehouses(data.data);
        if (data.pagination) {
          setWhPage(data.pagination.current || 1);
          setWhPages(data.pagination.pages || 1);
          setWhTotal(data.pagination.total || 0);
        }
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
      const params = new URLSearchParams();
      params.set('page', String(payPage));
      params.set('limit', String(payLimit));
      if (payStatus) params.set('status', payStatus);
      const response = await apiClient.get(`/admin/payments?${params.toString()}`);
      const data = response.data;

      if (data.success) {
        setPayments(data.data);
        if (data.pagination) {
          setPayPage(data.pagination.current || 1);
          setPayPages(data.pagination.pages || 1);
          setPayTotal(data.pagination.total || 0);
        }
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

  // Admin actions: update booking status and refund payment
  const updateBookingStatus = async (bookingId, status, notes) => {
    try {
      setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
      const res = await apiClient.patch(`/admin/bookings/${bookingId}/status`, { status, notes });
      if (res.data?.success) {
        toast.success(`Booking ${status.replace('-', ' ')} successfully`);
        await fetchBookings();
        await fetchStats();
      } else {
        toast.error(res.data?.message || 'Failed to update status');
      }
    } catch (e) {
      console.error('Update booking status failed', e);
      toast.error('Network error updating booking');
    } finally {
      setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const refundPayment = async (paymentId, amount, reason) => {
    try {
      const res = await apiClient.post(`/admin/payments/${paymentId}/refund`, { amount, reason });
      if (res.data?.success) {
        toast.success('Refund issued successfully');
        await fetchPayments();
        await fetchStats();
      } else {
        toast.error(res.data?.message || 'Failed to refund');
      }
    } catch (e) {
      console.error('Refund failed', e);
      toast.error('Network error issuing refund');
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
            {booking.farmer?.firstName || 'Unknown'} {booking.farmer?.lastName || ''} → {booking.warehouse?.name || 'Unknown Warehouse'}
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
          <h3 className="text-lg font-semibold text-gray-900">{warehouse.name || 'Warehouse'}</h3>
          <p className="text-sm text-gray-600 flex items-center">
            <MapPinIcon className="h-4 w-4 mr-1" />
            {(warehouse.location?.city || 'N/A')}, {(warehouse.location?.state || '')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warehouse.status)}`}>
            {(warehouse.status || 'unknown').toUpperCase()}
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(warehouse.verification?.status)}`}>
            {(warehouse.verification?.status || 'pending').toUpperCase()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Owner</p>
          <p className="font-medium">{warehouse.owner?.firstName || 'N/A'} {warehouse.owner?.lastName || ''}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Price/Day</p>
          <p className="font-medium text-green-600 flex items-center">
            <CurrencyRupeeIcon className="h-4 w-4 mr-1" />
            {warehouse.pricing?.basePrice ?? 0}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Capacity</p>
          <p className="font-medium">{warehouse.capacity?.available ?? 0} {warehouse.capacity?.unit || ''}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Bookings</p>
          <p className="font-medium">{warehouse.bookings?.length || 0}</p>
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
          <h3 className="text-lg font-semibold text-gray-900">#{payment.paymentId || (payment._id ? payment._id.slice(-6) : 'PAY')}</h3>
          <p className="text-sm text-gray-600">
            {payment.farmer?.firstName || 'Unknown'} {payment.farmer?.lastName || ''} → {payment.warehouseOwner?.firstName || 'Unknown'} {payment.warehouseOwner?.lastName || ''}
          </p>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
          {(payment.status || 'unknown').toUpperCase()}
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

  // Error fallback
  if (hasError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-4">The warehouse dashboard encountered an error.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        {/* Professional Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">Warehouse Management</h1>
              <p className="text-lg text-gray-600 font-medium">Comprehensive admin dashboard for warehouse and booking management</p>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm font-semibold text-green-700">Live Dashboard</span>
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Professional KPI Cards Section */}
        <div className="mb-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
            {/* Total Bookings Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
                    <CalendarIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalBookings}</p>
                  <p className="text-xs text-gray-400">All time bookings</p>
                </div>
              </div>
            </div>

            {/* Total Warehouses Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-green-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-50 to-green-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl shadow-sm">
                    <BuildingOfficeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Warehouses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalWarehouses}</p>
                  <p className="text-xs text-gray-400">Registered facilities</p>
                </div>
              </div>
            </div>

            {/* Total Payments Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-purple-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-50 to-purple-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl shadow-sm">
                    <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Payments</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalPayments}</p>
                  <p className="text-xs text-gray-400">Transaction count</p>
                </div>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-amber-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-amber-50 to-amber-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-amber-500 rounded-xl shadow-sm">
                    <CurrencyRupeeIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Total Revenue</p>
                  <p className="text-3xl font-bold text-gray-900">₹{stats.totalRevenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">Revenue generated</p>
                </div>
              </div>
            </div>

            {/* Pending Bookings Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-orange-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-orange-500 rounded-xl shadow-sm">
                    <ClockIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Pending Bookings</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingBookings}</p>
                  <p className="text-xs text-gray-400">Awaiting approval</p>
                </div>
              </div>
            </div>

            {/* Active Warehouses Card */}
            <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 hover:shadow-lg hover:border-emerald-200 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-bl-3xl opacity-60"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-emerald-500 rounded-xl shadow-sm">
                    <CheckCircleIcon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active Warehouses</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.activeWarehouses}</p>
                  <p className="text-xs text-gray-400">Currently operational</p>
                </div>
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
              <OverviewDashboard />
            )}

            {activeTab === 'bookings' && (
              <>
                {/* Booking filters */}
                <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Status</label>
                    <select className="border rounded px-2 py-1 text-sm" value={bkStatus} onChange={(e) => { setBkStatus(e.target.value); setBkPage(1); }}>
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="awaiting-approval">Awaiting Approval</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Per page</label>
                    <select className="border rounded px-2 py-1 text-sm" value={bkLimit} onChange={(e) => { setBkLimit(parseInt(e.target.value)); setBkPage(1); }}>
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                </div>
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📦</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No bookings found</h3>
                    <p className="text-gray-600">No booking data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bookings.map((booking, index) => (
                      <div key={booking._id}>
                        {renderBookingCard(booking, index)}
                        {/* Quick admin actions */}
                        <div className="flex gap-2 mt-2">
                          {(() => { const busy = !!actionLoading[booking._id]; return (
                            <>
                              <button disabled={busy} onClick={() => updateBookingStatus(booking._id, 'approved')} className={`px-3 py-1 text-xs rounded text-white ${busy ? 'opacity-60 cursor-not-allowed bg-green-600' : 'bg-green-600 hover:bg-green-700'}`} aria-busy={busy}>
                                {busy ? 'Processing…' : 'Approve'}
                              </button>
                              <button disabled={busy} onClick={() => updateBookingStatus(booking._id, 'rejected', 'Rejected by admin')} className={`px-3 py-1 text-xs rounded text-white ${busy ? 'opacity-60 cursor-not-allowed bg-red-600' : 'bg-red-600 hover:bg-red-700'}`} aria-busy={busy}>
                                {busy ? 'Processing…' : 'Reject'}
                              </button>
                              <button disabled={busy} onClick={() => updateBookingStatus(booking._id, 'completed')} className={`px-3 py-1 text-xs rounded text-white ${busy ? 'opacity-60 cursor-not-allowed bg-gray-700' : 'bg-gray-700 hover:bg-gray-800'}`} aria-busy={busy}>
                                {busy ? 'Processing…' : 'Mark Completed'}
                              </button>
                            </>
                          );})()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>Total: {bkTotal}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={bkPage <= 1} onClick={() => setBkPage(Math.max(1, bkPage - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                    <span>{bkPage} / {bkPages}</span>
                    <button disabled={bkPage >= bkPages} onClick={() => setBkPage(Math.min(bkPages, bkPage + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'warehouses' && (
              <>
                {/* Warehouse filters */}
                <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Status</label>
                    <select className="border rounded px-2 py-1 text-sm" value={whStatus} onChange={(e) => { setWhStatus(e.target.value); setWhPage(1); }}>
                      <option value="">All</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="draft">Draft</option>
                      <option value="maintenance">Maintenance</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Verification</label>
                    <select className="border rounded px-2 py-1 text-sm" value={whVerified} onChange={(e) => { setWhVerified(e.target.value); setWhPage(1); }}>
                      <option value="">All</option>
                      <option value="verified">Verified</option>
                      <option value="pending">Pending</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Per page</label>
                    <select className="border rounded px-2 py-1 text-sm" value={whLimit} onChange={(e) => { setWhLimit(parseInt(e.target.value)); setWhPage(1); }}>
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                </div>
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
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>Total: {whTotal}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={whPage <= 1} onClick={() => setWhPage(Math.max(1, whPage - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                    <span>{whPage} / {whPages}</span>
                    <button disabled={whPage >= whPages} onClick={() => setWhPage(Math.min(whPages, whPage + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'payments' && (
              <>
                {/* Payment filters */}
                <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Status</label>
                    <select className="border rounded px-2 py-1 text-sm" value={payStatus} onChange={(e) => { setPayStatus(e.target.value); setPayPage(1); }}>
                      <option value="">All</option>
                      <option value="completed">Completed</option>
                      <option value="refunded">Refunded</option>
                      <option value="failed">Failed</option>
                      <option value="pending">Pending</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600">Per page</label>
                    <select className="border rounded px-2 py-1 text-sm" value={payLimit} onChange={(e) => { setPayLimit(parseInt(e.target.value)); setPayPage(1); }}>
                      <option value={6}>6</option>
                      <option value={9}>9</option>
                      <option value={12}>12</option>
                    </select>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">💳</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments found</h3>
                    <p className="text-gray-600">No payment data available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {payments.map((payment, index) => (
                      <div key={payment._id}>
                        {renderPaymentCard(payment, index)}
                        <div className="flex gap-2 mt-2">
                          <button onClick={() => refundPayment(payment._id, payment.amount?.total)} className="px-3 py-1 text-xs rounded bg-purple-600 text-white">Refund Full</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Pagination */}
                <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
                  <div>Total: {payTotal}</div>
                  <div className="flex items-center gap-2">
                    <button disabled={payPage <= 1} onClick={() => setPayPage(Math.max(1, payPage - 1))} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
                    <span>{payPage} / {payPages}</span>
                    <button disabled={payPage >= payPages} onClick={() => setPayPage(Math.min(payPages, payPage + 1))} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
                  </div>
                </div>
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

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'verified': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'draft': 'bg-blue-100 text-blue-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'awaiting-approval': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'cancelled': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
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
          {item.type === 'warehouse' ? (
            <div className="space-y-6">
              {/* Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{item.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Description</label>
                    <p className="text-gray-900">{item.description}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Verification Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.verification?.status)}`}>
                      {item.verification?.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Address</label>
                    <p className="text-gray-900">{item.location?.address}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">City</label>
                    <p className="text-gray-900">{item.location?.city}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">State</label>
                    <p className="text-gray-900">{item.location?.state}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Pincode</label>
                    <p className="text-gray-900">{item.location?.pincode}</p>
                  </div>
                </div>
              </div>

              {/* Owner Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Owner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Name</label>
                    <p className="text-gray-900">{item.owner?.firstName} {item.owner?.lastName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Email</label>
                    <p className="text-gray-900">{item.owner?.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Phone</label>
                    <p className="text-gray-900">{item.contact?.phone || item.owner?.phone || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Capacity & Pricing */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Capacity & Pricing</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Capacity</label>
                    <p className="text-gray-900">{item.capacity?.total} {item.capacity?.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Available Capacity</label>
                    <p className="text-gray-900">{item.capacity?.available} {item.capacity?.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Base Price</label>
                    <p className="text-gray-900">₹{item.pricing?.basePrice}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Price Per Unit</label>
                    <p className="text-gray-900">{item.pricing?.pricePerUnit}</p>
                  </div>
                </div>
              </div>

              {/* Storage Types & Facilities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Storage & Facilities</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Storage Types</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.storageTypes?.map((type, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {type.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Facilities</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.facilities?.map((facility, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {facility.replace('_', ' ').toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Verification Details */}
              {item.verification && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Verified At</label>
                      <p className="text-gray-900">
                        {item.verification.verifiedAt ? formatDate(item.verification.verifiedAt) : 'Not verified'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Notes</label>
                      <p className="text-gray-900">{item.verification.notes || 'No notes'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Images */}
              {item.images && item.images.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Images</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {item.images.map((image, index) => (
                      <div key={index} className="relative">
                        <img 
                          src={image.url} 
                          alt={image.alt || `Warehouse image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        {image.isPrimary && (
                          <span className="absolute top-2 right-2 px-2 py-1 bg-blue-600 text-white text-xs rounded">
                            Primary
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : item.type === 'payment' ? (
            <div className="space-y-6">
              {/* Payment Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Payment Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payment ID</label>
                    <p className="text-gray-900 font-mono text-sm">{item.razorpay?.paymentId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Order ID</label>
                    <p className="text-gray-900 font-mono text-sm">{item.razorpay?.orderId || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount</label>
                    <p className="text-gray-900 font-semibold">₹{item.amount?.total || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Currency</label>
                    <p className="text-gray-900">{item.amount?.currency || 'INR'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created At</label>
                    <p className="text-gray-900">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </div>

              {/* Razorpay Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Razorpay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Captured</label>
                    <p className="text-gray-900">{item.razorpay?.captured ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">International</label>
                    <p className="text-gray-900">{item.razorpay?.international ? 'Yes' : 'No'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Amount Refunded</label>
                    <p className="text-gray-900">₹{item.razorpay?.amountRefunded || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Payout Status</label>
                    <p className="text-gray-900">{item.payout?.status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Parties */}
              {(item.farmer || item.warehouseOwner) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Transaction Parties</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {item.farmer && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Farmer</label>
                        <p className="text-gray-900">{item.farmer.firstName || 'Unknown'} {item.farmer.lastName || ''}</p>
                        <p className="text-sm text-gray-500">{item.farmer.email || 'No email'}</p>
                      </div>
                    )}
                    {item.warehouseOwner && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Warehouse Owner</label>
                        <p className="text-gray-900">{item.warehouseOwner.firstName || 'Unknown'} {item.warehouseOwner.lastName || ''}</p>
                        <p className="text-sm text-gray-500">{item.warehouseOwner.email || 'No email'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : item.type === 'booking' ? (
            <div className="space-y-6">
              {/* Booking Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Booking ID</label>
                    <p className="text-gray-900 font-mono">#{item.bookingId}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Status</label>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status?.replace('-', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Farmer</label>
                    <p className="text-gray-900">{item.farmer?.firstName || 'Unknown'} {item.farmer?.lastName || ''}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Warehouse</label>
                    <p className="text-gray-900">{item.warehouse?.name || 'Unknown Warehouse'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Produce Type</label>
                    <p className="text-gray-900">{item.produce?.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Quantity</label>
                    <p className="text-gray-900">{item.produce?.quantity} {item.produce?.unit}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Start Date</label>
                    <p className="text-gray-900">{formatDate(item.bookingDates?.startDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">End Date</label>
                    <p className="text-gray-900">{formatDate(item.bookingDates?.endDate)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Total Amount</label>
                    <p className="text-gray-900 font-semibold text-green-600">₹{item.pricing?.totalAmount}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Created</label>
                    <p className="text-gray-900">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <pre className="text-sm text-gray-600 overflow-auto">
              {JSON.stringify(item, null, 2)}
            </pre>
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
          {item.type === 'warehouse' && item.verification?.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  // Call the parent component's verification handler
                  window.dispatchEvent(new CustomEvent('verifyWarehouse', { 
                    detail: { warehouseId: item._id, status: 'verified' } 
                  }));
                  handleClose();
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <CheckCircleIcon className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => {
                  // Call the parent component's verification handler
                  window.dispatchEvent(new CustomEvent('verifyWarehouse', { 
                    detail: { warehouseId: item._id, status: 'rejected' } 
                  }));
                  handleClose();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <XCircleIcon className="h-4 w-4" />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminWarehouseDashboard;
