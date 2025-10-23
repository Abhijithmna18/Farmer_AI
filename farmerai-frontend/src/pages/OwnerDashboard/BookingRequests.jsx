import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

export default function OwnerBookings(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      
      const res = await apiClient.get('/owner/bookings', { params });
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const act = async (id, action) => {
    try {
      await apiClient.patch(`/owner/bookings/${id}/${action}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to update booking');
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={load}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Booking Requests</h1>
          <p className="text-gray-600">Manage and track all warehouse booking requests</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">All Bookings</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {items.map(b => (
          <div key={b._id} className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">
                      {b.warehouse?.name || 'Unknown Warehouse'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Booking ID: #{b.bookingId}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(b.payment?.status)}`}>
                      {b.payment?.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Farmer Details</p>
                    <p className="text-sm text-gray-600">
                      {b.farmer?.firstName} {b.farmer?.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{b.farmer?.email}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Produce Details</p>
                    <p className="text-sm text-gray-600">
                      {b.produce?.type} • {b.produce?.quantity} {b.produce?.unit}
                    </p>
                    <p className="text-xs text-gray-500">Quality: {b.produce?.quality || 'Good'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Booking Period</p>
                    <p className="text-sm text-gray-600">
                      {new Date(b.bookingDates?.startDate).toLocaleDateString()} - {new Date(b.bookingDates?.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-gray-500">{b.bookingDates?.duration} days</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Pricing</p>
                    <div className="text-sm text-gray-600">
                      <p>Base Price: ₹{b.pricing?.basePrice?.toLocaleString() || 0}</p>
                      <p>Total Amount: ₹{b.pricing?.totalAmount?.toLocaleString() || 0}</p>
                      <p>Your Earnings: ₹{b.pricing?.ownerAmount?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">Storage Requirements</p>
                    <div className="text-sm text-gray-600">
                      <p>Type: {b.storageRequirements?.storageType || 'General'}</p>
                      {b.storageRequirements?.temperature && (
                        <p>Temperature: {b.storageRequirements.temperature.min}°C - {b.storageRequirements.temperature.max}°C</p>
                      )}
                      {b.storageRequirements?.humidity && (
                        <p>Humidity: {b.storageRequirements.humidity.min}% - {b.storageRequirements.humidity.max}%</p>
                      )}
                    </div>
                  </div>
                </div>

                {b.produce?.description && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">Description</p>
                    <p className="text-sm text-gray-600">{b.produce.description}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col space-y-2 lg:min-w-[200px]">
                {b.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => act(b._id, 'approve')} 
                      className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      Approve Booking
                    </button>
                    <button 
                      onClick={() => act(b._id, 'reject')} 
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
                    >
                      Reject Booking
                    </button>
                  </>
                )}
                
                {b.status === 'approved' && b.payment?.status === 'paid' && (
                  <div className="text-center">
                    <span className="inline-block px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
                      ✓ Confirmed & Paid
                    </span>
                  </div>
                )}
                
                <button 
                  onClick={() => window.open(`/owner/bookings/${b._id}`, '_blank')}
                  className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-6xl mb-4">📦</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? "You haven't received any booking requests yet." 
                : `No ${statusFilter} bookings found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}














