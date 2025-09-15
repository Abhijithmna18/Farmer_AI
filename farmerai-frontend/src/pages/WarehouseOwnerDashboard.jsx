// src/pages/WarehouseOwnerDashboard.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import useAuth from '../hooks/useAuth';
import WarehouseRegistrationForm from '../components/WarehouseRegistrationForm';

const SummaryCard = ({ title, value, accent = 'text-green-600', icon }) => (
  <div className="bg-white rounded-2xl shadow p-5 border border-gray-100">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${accent.replace('text-', 'bg-').replace('600', '100')}`}>{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
      </div>
    </div>
  </div>
);

const OwnerWarehouseRow = ({ wh, onEdit, onDelete, onToggle }) => {
  const used = Math.max(0, (wh.capacity?.total || 0) - (wh.capacity?.available ?? 0));
  const total = wh.capacity?.total || 0;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return (
    <div className="p-4 bg-white rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="font-semibold text-gray-900">{wh.name}</div>
        <div className="text-sm text-gray-600">{wh.location?.city}, {wh.location?.state} • {total} {wh.capacity?.unit || 'units'}</div>
        <div className="mt-2">
          <div className="w-64 h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-green-600 rounded-full" style={{ width: `${pct}%` }}></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Occupancy: {pct}% (used {used} / {total})</div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={() => onToggle(wh)} className={`px-3 py-1 rounded-lg text-sm ${wh.isActive === false ? 'bg-green-600 text-white' : 'bg-yellow-100 text-yellow-700'}`}>
          {wh.isActive === false ? 'Open' : 'Close'}
        </button>
        <button onClick={() => onEdit(wh)} className="px-3 py-1 rounded-lg text-sm bg-blue-600 text-white">Edit</button>
        <button onClick={() => onDelete(wh)} className="px-3 py-1 rounded-lg text-sm bg-red-600 text-white">Delete</button>
      </div>
    </div>
  );
};

const BookingRow = ({ bk, onApprove, onReject }) => (
  <div className="p-4 bg-white rounded-xl border border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
    <div>
      <div className="font-semibold text-gray-900">{bk.farmer?.firstName} {bk.farmer?.lastName} • #{bk.bookingId}</div>
      <div className="text-sm text-gray-600">{bk.produce?.type} • {bk.produce?.quantity} {bk.produce?.unit}</div>
      <div className="text-xs text-gray-500">{new Date(bk.bookingDates?.startDate).toLocaleDateString()} → {new Date(bk.bookingDates?.endDate).toLocaleDateString()} • Payment: {bk.payment?.status}</div>
    </div>
    <div className="flex items-center gap-2">
      {bk.status === 'awaiting-approval' ? (
        <>
          <button onClick={() => onApprove(bk)} className="px-3 py-1 rounded-lg text-sm bg-green-600 text-white">Approve</button>
          <button onClick={() => onReject(bk)} className="px-3 py-1 rounded-lg text-sm bg-red-600 text-white">Reject</button>
        </>
      ) : (
        <span className={`px-2 py-1 rounded text-xs ${bk.status === 'approved' ? 'bg-green-100 text-green-700' : bk.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>{bk.status}</span>
      )}
    </div>
  </div>
);

const WarehouseOwnerDashboard = () => {
  const { user } = useAuth();
  const containerRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [warehouses, setWarehouses] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [paymentStats, setPaymentStats] = useState({ total: 0, monthly: 0 });
  const [bookingStats, setBookingStats] = useState({ totalBookings: 0, pending: 0, approved: 0 });
  const [showForm, setShowForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState(null);

  const isOwner = (user?.role === 'warehouse-owner') || (Array.isArray(user?.roles) && user.roles.includes('warehouse-owner')) || user?.userType === 'warehouse-owner';

  useEffect(() => {
    gsap.fromTo(containerRef.current, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power2.out' });
  }, []);

  const refreshAll = async () => {
    try {
      setLoading(true);
      setError(null);
      const [whRes, bkRes, payStatsRes, bkStatsRes] = await Promise.all([
        apiClient.get('/warehouses/owner/my-warehouses'),
        apiClient.get('/warehouses/bookings/my-bookings?status=awaiting-approval'),
        apiClient.get('/warehouses/stats/payments'),
        apiClient.get('/warehouses/stats/bookings')
      ]);

      if (whRes.data?.success) setWarehouses(whRes.data.data || []);
      if (bkRes.data?.success) setBookings(bkRes.data.data || []);
      if (payStatsRes.data?.success) setPaymentStats(payStatsRes.data.data || {});
      if (bkStatsRes.data?.success) setBookingStats(bkStatsRes.data.data || {});
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refreshAll(); }, []);

  const totalWarehouses = warehouses.length;
  const activeBookings = bookingStats?.approved || 0;
  const monthlyEarnings = paymentStats?.thisMonth || paymentStats?.monthly || 0;

  const averageOccupancy = useMemo(() => {
    if (!warehouses.length) return 0;
    const sum = warehouses.reduce((acc, w) => {
      const used = Math.max(0, (w.capacity?.total || 0) - (w.capacity?.available ?? 0));
      const total = w.capacity?.total || 0;
      return acc + (total > 0 ? used / total : 0);
    }, 0);
    return Math.round((sum / warehouses.length) * 100);
  }, [warehouses]);

  const approveBooking = async (bk) => {
    try {
      await apiClient.post(`/warehouses/bookings/${bk._id}/approve`, {});
      await refreshAll();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to approve booking');
    }
  };

  const rejectBooking = async (bk) => {
    try {
      await apiClient.post(`/warehouses/bookings/${bk._id}/reject`, { reason: 'Rejected by owner' });
      await refreshAll();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to reject booking');
    }
  };

  const toggleAvailability = async (wh) => {
    try {
      await apiClient.put(`/warehouses/${wh._id}`, { isActive: wh.isActive === false });
      await refreshAll();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to update availability');
    }
  };

  const deleteWarehouse = async (wh) => {
    if (!confirm('Delete this warehouse?')) return;
    try {
      await apiClient.delete(`/warehouses/${wh._id}`);
      await refreshAll();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed to delete warehouse');
    }
  };

  if (!isOwner) {
    return (
      <div className="p-6">
        <div className="max-w-4xl mx-auto bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-xl p-4">Access restricted. You must be a warehouse owner to view this page.</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Warehouse Owner Dashboard</h1>
            <p className="text-gray-600">Manage warehouses, bookings, and revenue</p>
          </div>
          <button onClick={() => { setEditingWarehouse(null); setShowForm(true); }} className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700">Add New Warehouse</button>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-800 rounded-xl p-4">{error}</div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <SummaryCard title="Total Warehouses" value={totalWarehouses} icon={<span>🏬</span>} />
          <SummaryCard title="Active Bookings" value={activeBookings} accent="text-blue-600" icon={<span>📦</span>} />
          <SummaryCard title="Monthly Earnings (₹)" value={monthlyEarnings} accent="text-emerald-600" icon={<span>💰</span>} />
          <SummaryCard title="Avg Occupancy" value={`${averageOccupancy}%`} accent="text-purple-600" icon={<span>📈</span>} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Warehouses */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Your Warehouses</h2>
              <button onClick={refreshAll} className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Refresh</button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : warehouses.length === 0 ? (
                <div className="text-gray-500">No warehouses yet. Click "Add New Warehouse" to create one.</div>
              ) : (
                warehouses.map(w => (
                  <OwnerWarehouseRow
                    key={w._id}
                    wh={w}
                    onEdit={(wh) => { setEditingWarehouse(wh); setShowForm(true); }}
                    onDelete={deleteWarehouse}
                    onToggle={toggleAvailability}
                  />
                ))
              )}
            </div>
          </div>

          {/* Booking Requests */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Booking Requests</h2>
              <button onClick={refreshAll} className="text-sm px-3 py-1 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">Refresh</button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : bookings.length === 0 ? (
                <div className="text-gray-500">No pending requests.</div>
              ) : (
                bookings.map(b => (
                  <BookingRow key={b._id} bk={b} onApprove={approveBooking} onReject={rejectBooking} />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Reports quick export (CSV minimal) */}
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Reports</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  // Export warehouses to CSV (basic)
                  const rows = [
                    ['Name', 'City', 'State', 'Capacity', 'Available'],
                    ...warehouses.map(w => [
                      w.name,
                      w.location?.city || '',
                      w.location?.state || '',
                      String(w.capacity?.total || 0),
                      String(w.capacity?.available ?? 0)
                    ])
                  ];
                  const csv = rows.map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'warehouses.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 rounded-lg bg-green-600 text-white text-sm"
              >Export Warehouses CSV</button>
              <button
                onClick={() => {
                  const rows = [
                    ['BookingId', 'Farmer', 'Produce', 'Qty', 'Dates', 'Status'],
                    ...bookings.map(b => [
                      b.bookingId,
                      `${b.farmer?.firstName || ''} ${b.farmer?.lastName || ''}`.trim(),
                      b.produce?.type || '',
                      `${b.produce?.quantity || ''} ${b.produce?.unit || ''}`.trim(),
                      `${new Date(b.bookingDates?.startDate).toLocaleDateString()} - ${new Date(b.bookingDates?.endDate).toLocaleDateString()}`,
                      b.status
                    ])
                  ];
                  const csv = rows.map(r => r.map(col => `"${String(col).replace(/"/g, '""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = 'booking-requests.csv'; a.click();
                  URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm"
              >Export Requests CSV</button>
            </div>
          </div>
          <div className="text-sm text-gray-600">Payouts and advanced analytics (charts, forecasting) can be added next. Core approval and revenue stats are wired.</div>
        </div>

        {/* Create/Edit Warehouse Modal */}
        <WarehouseRegistrationForm
          isOpen={showForm}
          onClose={() => setShowForm(false)}
          onSuccess={() => { setShowForm(false); refreshAll(); }}
        />
      </div>
    </div>
  );
};

export default WarehouseOwnerDashboard;



