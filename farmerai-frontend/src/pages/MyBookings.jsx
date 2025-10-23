import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarIcon, MapPinIcon, CurrencyRupeeIcon, ClockIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import useAuth from '../hooks/useAuth';
import { onBookingEvent } from '../services/realtimeClient';
import { normalizeBooking } from '../utils/bookingViewModel';

const MyBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, cancelled
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, amount_desc, amount_asc, upcoming
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    console.log('MyBookings component mounted');
    console.log('User:', user);
    console.log('Auth loading:', authLoading);
    console.log('Token:', localStorage.getItem('token'));
    
    if (!authLoading && user) {
      fetchBookings();
    } else if (!authLoading && !user) {
      console.log('No user found, redirecting to login...');
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // Realtime synchronization via Socket.IO and periodic refresh
  useEffect(() => {
    const off = onBookingEvent?.(() => {
      fetchBookings();
    });
    const interval = setInterval(fetchBookings, 60_000);
    return () => {
      if (typeof off === 'function') off();
      clearInterval(interval);
    };
  }, []);

  // Add a manual refresh function
  const refreshBookings = () => {
    fetchBookings();
  };

  useEffect(() => {
    if (bookings.length > 0) {
      gsap.fromTo('.booking-card',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' }
      );
    }
  }, [bookings]);

  const [lastFetchedAt, setLastFetchedAt] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      console.log('Fetching bookings...');
      const response = await apiClient.get('/warehouse-bookings/my-bookings', {
        headers: lastFetchedAt ? { 'If-Modified-Since': new Date(lastFetchedAt).toUTCString() } : {}
      });
      console.log('Bookings response:', response.data);
      
      if (response.data.success) {
        const items = Array.isArray(response.data.data) ? response.data.data : [];
        const normalized = items.map((it) => normalizeBooking(it, user?.name));
        
        // Auto-reconcile bookings with zero pricing, but only if they don't have a paid status
        const bookingsNeedingFix = normalized.filter(b => 
          (!b.pricing?.totalAmount || b.pricing.totalAmount === 0) && b.payment?.status !== 'paid'
        );
        
        if (bookingsNeedingFix.length > 0) {
          console.log(`Found ${bookingsNeedingFix.length} bookings with zero pricing, auto-reconciling...`);
          // Reconcile in background without blocking UI
          Promise.all(
            bookingsNeedingFix.map(b => 
              apiClient.get(`/warehouse-bookings/${b._id}/reconcile`)
                .catch(err => console.error(`Failed to reconcile booking ${b._id}:`, err))
            )
          ).then(() => {
            // Refresh bookings after reconciliation
            console.log('Reconciliation complete, refreshing bookings...');
            setTimeout(() => fetchBookings(), 1000);
          });
        }
        
        setBookings(normalized);
        setLastFetchedAt(Date.now());
        // Aggregate inconsistency logging and simple alerting
        const inconsistent = normalized.filter(b => (b.inconsistencies||[]).length > 0);
        if (normalized.length > 0) {
          const pct = (inconsistent.length / normalized.length) * 100;
          if (pct > 1) {
            console.warn('Inconsistency rate >1%', { count: inconsistent.length, total: normalized.length, pct });
          }
        }
      } else {
        setError(response.data.message || 'Failed to fetch bookings');
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
      console.error('Error details:', err.response?.data);
      
      // Check if it's an authentication error
      if (err.response?.status === 401) {
        console.log('Authentication failed, redirecting to login...');
        navigate('/login');
        return;
      }
      
      setError(err.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  // Refresh a single booking from the backend, preferring reconcile endpoint
  const refreshBookingById = async (id) => {
    try {
      let res = await apiClient.get(`/warehouse-bookings/${id}/reconcile`);
      if (!res.data?.success) {
        res = await apiClient.get(`/warehouse-bookings/${id}`);
      }
      if (res.data?.success) {
        const nb = normalizeBooking(res.data.data, user?.name);
        setBookings((prev) => prev.map(b => (b._id === id ? nb : b)));
      }
    } catch (e) {
      console.error('Refresh booking failed', e);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const response = await apiClient.post(`/warehouse-bookings/${bookingId}/cancel`);
      
      if (response.data.success) {
        toast.success('Booking cancelled successfully');
        fetchBookings(); // Refresh the list
      } else {
        toast.error(response.data.message || 'Failed to cancel booking');
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ExclamationTriangleIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredBookings = useMemo(() => {
    const byStatus = bookings.filter(b => (filter === 'all' ? true : b.status === filter));
    const q = search.trim().toLowerCase();
    const bySearch = q
      ? byStatus.filter(b => {
          const name = b.warehouse?.name || '';
          const addr = b.warehouse?.location?.address || '';
          const produce = b.produce?.type || '';
          return (
            name.toLowerCase().includes(q) ||
            addr.toLowerCase().includes(q) ||
            produce.toLowerCase().includes(q)
          );
        })
      : byStatus;
    const sorted = [...bySearch].sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === 'amount_desc') return ((b.pricing?.totalAmount ?? 0)) - ((a.pricing?.totalAmount ?? 0));
      if (sortBy === 'amount_asc') return ((a.pricing?.totalAmount ?? 0)) - ((b.pricing?.totalAmount ?? 0));
      if (sortBy === 'upcoming') return new Date(a.startDate) - new Date(b.startDate);
      return 0;
    });
    return sorted;
  }, [bookings, filter, search, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const pagedBookings = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, page, pageSize]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    const d = new Date(dateString);
    if (isNaN(d)) return '—';
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Simple section renderer
  const Section = ({ title, ariaLabel, items, renderItem }) => (
    <section aria-label={ariaLabel} className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      {items.length === 0 ? (
        <div className="text-sm text-gray-600">No items</div>
      ) : (
        items.map(renderItem)
      )}
    </section>
  );

  // Booking card with complete details and sane fallbacks
  const BookingCard = ({ booking, onCancel, onModify, onRefresh }) => {
    const id = booking._id || booking.id || '—';
    const customerName = booking.customerName || '—';
    const address = booking.warehouse?.location?.address || 'Location not specified';
    
    // Determine if there's a pricing issue
    const hasPricingIssue = !booking.pricing?.totalAmount || booking.pricing.totalAmount === 0;
    const isPaidBooking = booking.payment?.status === 'paid';
    
    // Get the correct amount to display
    // For paid bookings, we still want to show the total amount
    // For unpaid bookings, we show the amount due
    const totalAmount = booking.pricing?.totalAmount ?? 0;
    const amountDue = booking.payment?.amountDue ?? totalAmount;
    
    // Determine what to display
    let priceDisplay = '₹0.00';
    if (hasPricingIssue && !isPaidBooking) {
      // Show ₹0.00 with error indicator for unpaid bookings with pricing issues
      priceDisplay = '₹0.00';
    } else if (isPaidBooking) {
      // For paid bookings, show the total amount
      priceDisplay = formatCurrency(totalAmount);
    } else {
      // For unpaid bookings, show the amount due
      priceDisplay = formatCurrency(amountDue);
    }
    
    // Determine if we should show "Payment Due" badge
    const showPaymentDue = !isPaidBooking && typeof amountDue === 'number' && amountDue > 0;
    
    const start = formatDate(booking.startDate);
    const end = formatDate(booking.endDate);
    const created = formatDate(booking.createdAt);
    const updated = booking.updatedAt ? formatDate(booking.updatedAt) : null;
    const qty = (booking.produce?.quantity ?? booking.quantity ?? null);
    const durationDays = booking.duration ?? null;
    const canModify = (['approved','pending'].includes(booking.status) && booking.startDate && new Date(booking.startDate).getTime() > now);

    return (
      <div className="booking-card bg-white rounded-lg shadow-lg overflow-hidden" role="article" aria-label={`Booking ${id}`}>
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-xl font-semibold text-gray-900">{booking.warehouse?.name || 'Unknown Warehouse'}</h3>
                <span className="text-xs text-gray-500">ID: {id}</span>
              </div>
              <div className="text-sm text-gray-600 mb-2">Customer: <span className="font-medium text-gray-800">{customerName}</span></div>
              <div className="flex items-center text-gray-600 mb-2">
                <MapPinIcon className="h-5 w-5 mr-2" />
                <span>{address}</span>
              </div>
              <div className="flex items-center text-gray-700">
                <CalendarIcon className="h-5 w-5 mr-2" />
                <span className="font-medium">{start}</span>
                <span className="mx-1">–</span>
                <span className="font-medium">{end}</span>
              </div>
            </div>
            <div className="text-right">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {getStatusIcon(booking.status)}
                <span className="ml-1 capitalize">{booking.status}</span>
              </div>
              <div className="mt-2 flex items-center justify-end space-x-2">
                {hasPricingIssue && !isPaidBooking && (
                  <div className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center">
                    <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
                    Pricing Error
                  </div>
                )}
                {showPaymentDue && (
                  <div className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800">
                    Payment Due
                  </div>
                )}
                {!showPaymentDue && booking.payment?.status === 'paid' && (
                  <div className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">Paid</div>
                )}
                <div className={`text-2xl font-bold ${hasPricingIssue && !isPaidBooking ? 'text-red-600' : 'text-gray-900'}`}>{priceDisplay}</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Produce Details</h4>
              <p className="text-sm text-gray-600">
                {booking.produce?.type ? `${booking.produce.type} — ${booking.produce.quantity} ${booking.produce.unit || 'tons'}` : (typeof qty === 'number' ? `${qty} tons` : 'Not specified')}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
              <p className="text-sm text-gray-600">{durationDays == null ? '—' : (durationDays < 1 ? 'Less than a day' : `${durationDays} days`)}</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Payment Status</h4>
              <p className="text-sm text-gray-600">{booking.payment?.status || 'pending'}</p>
            </div>
          </div>

          {booking.notes && (
            <div className="mb-4">
              <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
              <p className="text-sm text-gray-600">{booking.notes}</p>
            </div>
          )}

          {hasPricingIssue && !isPaidBooking && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center text-red-800">
                  <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
                  <span className="text-sm font-medium">Pricing calculation error detected. Click "Fix Pricing" to recalculate.</span>
                </div>
                <button 
                  onClick={() => onRefresh?.(booking._id)} 
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  aria-label="Fix pricing"
                >
                  Fix Pricing
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-500">Booked on {created}{updated ? ` • Last updated ${updated}` : ''}</div>
            <div className="flex space-x-2">
              {booking.status === 'pending' && (
                <button onClick={() => onCancel?.(booking._id)} className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors" aria-label="Cancel booking">Cancel Booking</button>
              )}
              {canModify && (
                <button onClick={() => onModify?.(booking._id, booking.warehouse?._id)} className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors" aria-label="Modify booking">Modify Booking</button>
              )}
              {booking.invoiceUrl && (
                <a href={booking.invoiceUrl} target="_blank" rel="noreferrer" className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" aria-label="View invoice">View Invoice</a>
              )}
              {booking.status === 'approved' && showPaymentDue && !hasPricingIssue && (
                <button onClick={() => navigate(`/payment/${booking._id}`)} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors" aria-label="Pay now">Pay Now</button>
              )}
              {!hasPricingIssue && (
                <button onClick={() => onRefresh?.(booking._id)} className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Refresh booking">Refresh</button>
              )}
              <button onClick={() => navigate(`/warehouses/${booking.warehouse?._id}`)} className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors" aria-label="View warehouse">View Warehouse</button>
            </div>
          </div>
          {Array.isArray(booking.inconsistencies) && booking.inconsistencies.length > 0 && (
            <div className="mt-3 text-sm text-amber-700 flex items-center" title="Inconsistent data — verifying">
              ⚠️ Inconsistent data — verifying
            </div>
          )}
        </div>
      </div>
    );
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <div className="h-7 w-40 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-80 bg-gray-200 rounded"></div>
          </div>
          <div className="grid gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-lg p-6 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="space-y-2">
                    <div className="h-5 w-56 bg-gray-200 rounded"></div>
                    <div className="h-4 w-72 bg-gray-200 rounded"></div>
                    <div className="h-4 w-48 bg-gray-200 rounded"></div>
                  </div>
                  <div className="space-y-2 text-right">
                    <div className="h-6 w-24 bg-gray-200 rounded-full ml-auto"></div>
                    <div className="h-7 w-20 bg-gray-200 rounded ml-auto"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="h-4 w-40 bg-gray-200 rounded"></div>
                  <div className="h-4 w-32 bg-gray-200 rounded"></div>
                  <div className="h-4 w-28 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Classify bookings for sectioned view
  const now = Date.now();
  const isCanceled = (b) => (b.status === 'cancelled' || b.status === 'rejected');
  const isUpcoming = (b) => !isCanceled(b) && new Date(b.endDate).getTime() >= now;
  const isPast = (b) => !isCanceled(b) && new Date(b.endDate).getTime() < now;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header + Toolbar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
              <p className="text-gray-600">Manage your warehouse bookings and track their status</p>
            </div>
            <button
              onClick={() => navigate('/warehouses')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Browse Warehouses
            </button>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name, location, or produce"
              className="col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex items-center space-x-2 justify-end">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
                <option value="upcoming">Upcoming Start</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="mb-6" role="tablist" aria-label="Booking filters">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            {[
              { key: 'all', label: 'All Bookings', count: bookings.length },
              { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
              { key: 'approved', label: 'Approved', count: bookings.filter(b => b.status === 'approved').length },
              { key: 'rejected', label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length },
              { key: 'cancelled', label: 'Cancelled', count: bookings.filter(b => b.status === 'cancelled').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                role="tab"
                aria-selected={filter === tab.key}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  filter === tab.key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
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
              <div className="ml-3 flex items-center justify-between w-full">
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
                <button onClick={fetchBookings} className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700">Retry</button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No Bookings Yet' : `No ${filter} bookings`}
            </h3>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "You haven't made any warehouse bookings yet. Start by browsing available warehouses."
                : `You don't have any ${filter} bookings at the moment.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/warehouses')}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Browse Warehouses
              </button>
            )}
          </div>
        ) : (
          <>
          {/* When filter is 'all', show grouped sections for clarity */}
          {filter === 'all' ? (
            <div className="space-y-10">
              <Section
                title="Upcoming bookings"
                ariaLabel="Upcoming bookings"
                items={filteredBookings.filter(isUpcoming)}
                renderItem={(b) => (
                  <BookingCard key={b._id} booking={b} onCancel={handleCancelBooking} onModify={(id, whId) => navigate(`/warehouses/${whId}?bookingId=${id}&edit=1`)} onRefresh={refreshBookingById} />
                )}
              />
              <Section
                title="Past bookings"
                ariaLabel="Past bookings"
                items={filteredBookings.filter(isPast)}
                renderItem={(b) => (
                  <BookingCard key={b._id} booking={b} onCancel={handleCancelBooking} onModify={(id, whId) => navigate(`/warehouses/${whId}?bookingId=${id}&edit=1`)} onRefresh={refreshBookingById} />
                )}
              />
              <Section
                title="Canceled bookings"
                ariaLabel="Canceled bookings"
                items={filteredBookings.filter(isCanceled)}
                renderItem={(b) => (
                  <BookingCard key={b._id} booking={b} onCancel={handleCancelBooking} onModify={(id, whId) => navigate(`/warehouses/${whId}?bookingId=${id}&edit=1`)} onRefresh={refreshBookingById} />
                )}
              />
            </div>
          ) : (
            <div className="space-y-6">
            {pagedBookings.map((booking) => (
              <div key={booking._id} className="booking-card bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {booking.warehouse?.name || 'Unknown Warehouse'}
                      </h3>
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPinIcon className="h-5 w-5 mr-2" />
                        <span>{booking.warehouse?.location?.address || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <CalendarIcon className="h-5 w-5 mr-2" />
                        <span>
                          {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1 capitalize">{booking.status}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-end space-x-2">
                        <div className={`text-xs px-2 py-0.5 rounded-full ${booking.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {booking.paymentStatus === 'paid' ? 'Paid' : 'Payment Due'}
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{formatCurrency(booking.totalAmount || 0)}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Produce Details</h4>
                      <p className="text-sm text-gray-600">
                        {booking.produceType || 'Not specified'} - {booking.quantity || 0} tons
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Duration</h4>
                      <p className="text-sm text-gray-600">
                        {booking.duration || 0} days
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-1">Payment Status</h4>
                      <p className="text-sm text-gray-600">
                        {booking.paymentStatus || 'Pending'}
                      </p>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-1">Notes</h4>
                      <p className="text-sm text-gray-600">{booking.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Booked on {formatDate(booking.createdAt)}
                    </div>
                    <div className="flex space-x-2">
                      {booking.status === 'pending' && (
                        <button
                          onClick={() => handleCancelBooking(booking._id)}
                          className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                          aria-label="Cancel booking"
                        >
                          Cancel Booking
                        </button>
                      )}
                      {/* Modify button for active future bookings */}
                      {(['approved','pending'].includes(booking.status) && new Date(booking.startDate).getTime() > now) && (
                        <button
                          onClick={() => navigate(`/warehouses/${booking.warehouse?._id}?bookingId=${booking._id}&edit=1`)}
                          className="px-4 py-2 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                          aria-label="Modify booking"
                        >
                          Modify Booking
                        </button>
                      )}
                      {booking.invoiceUrl && (
                        <a
                          href={booking.invoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                          aria-label="View invoice"
                        >
                          View Invoice
                        </a>
                      )}
                      {booking.status === 'approved' && booking.paymentStatus !== 'paid' && (
                        <button
                          onClick={() => navigate(`/payment/${booking._id}`)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          aria-label="Pay now"
                        >
                          Pay Now
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/warehouses/${booking.warehouse?._id}`)}
                        className="px-4 py-2 text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                        aria-label="View warehouse"
                      >
                        View Warehouse
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          {/* Pagination */}
          {filteredBookings.length > pageSize && (
            <div className="flex items-center justify-between mt-8">
              <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className={`px-3 py-1.5 rounded border ${page === 1 ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Previous
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="px-3 py-1.5 border border-gray-300 rounded"
                >
                  <option value={5}>5 / page</option>
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                </select>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className={`px-3 py-1.5 rounded border ${page === totalPages ? 'text-gray-400 border-gray-200' : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                >
                  Next
                </button>
              </div>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyBookings;