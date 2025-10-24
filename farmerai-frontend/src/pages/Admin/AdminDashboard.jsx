import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, XAxis, YAxis, Bar, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { fetchAdminAnalytics, fetchAdminOverview, fetchAdminReports, fetchWarehouseAnalytics, fetchBookingAnalytics, fetchPaymentAnalytics } from '../../services/adminService';
import apiClient from '../../services/apiClient';

const StatCard = ({ title, value, icon }) => (
  <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <div>
        <div className="text-slate-500 text-sm">{title}</div>
        <div className="text-2xl font-semibold text-slate-800 mt-1">{value}</div>
      </div>
      <div className="w-12 h-12 rounded-xl bg-emerald-100 grid place-items-center text-emerald-700 text-xl">{icon}</div>
    </div>
  </div>
);

const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

export default function AdminDashboard() {
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [reports, setReports] = useState({ total: 0, contacts: [] });
  const [range, setRange] = useState('7d');
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);

  const loadData = async (r) => {
    try {
      const [ov, an, rp, wa, ba, pa] = await Promise.all([
        fetchAdminOverview(),
        fetchAdminAnalytics({ range: r }),
        fetchAdminReports({ range: r }),
        fetchWarehouseAnalytics({ range: r }),
        fetchBookingAnalytics({ range: r }),
        fetchPaymentAnalytics({ range: r }),
      ]);
      setOverview(ov.data);
      setAnalytics(an.data);
      setReports(rp.data);
      setWarehouseStats(wa.data?.data || wa.data);
      setBookingStats(ba.data?.data || ba.data);
      setPaymentStats(pa.data?.data || pa.data);

      // Load pending events for moderation widget
      try {
        const pev = await apiClient.get('/community/events/pending');
        setPendingEvents(Array.isArray(pev.data?.events) ? pev.data.events.slice(0, 5) : []);
      } catch (e) {
        setPendingEvents([]);
      }
    } catch (e) {
      toast.error('Failed to load admin data');
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Admin Dashboard</h1>
        <p className="text-slate-500">Overview and quick actions</p>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-slate-600">Date Range</label>
        <select value={range} onChange={e => setRange(e.target.value)} className="px-3 py-2 rounded-lg border bg-white">
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="all">All time</option>
        </select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={overview?.totalUsers ?? analytics?.users?.total ?? '—'} icon="👥" />
        <StatCard title="Farmers" value={analytics?.users?.farmers ?? '—'} icon="🌾" />
        <StatCard title="Buyers" value={analytics?.users?.buyers ?? '—'} icon="🛒" />
        <StatCard title="Pending Reports" value={analytics?.reports?.pendingContacts ?? reports?.total ?? '—'} icon="🚩" />
      </div>

      {(warehouseStats || bookingStats || paymentStats) && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouseStats && (
            <StatCard title="Verified Warehouses" value={warehouseStats.verifiedWarehouses ?? warehouseStats.totalWarehouses ?? '—'} icon="🏪" />
          )}
          {bookingStats && (
            <StatCard title="Total Bookings" value={bookingStats.totalBookings ?? '—'} icon="📦" />
          )}
          {paymentStats && (
            <StatCard title="Total Revenue (₹)" value={(paymentStats.totalAmount ?? 0).toLocaleString()} icon="💰" />
          )}
        </div>
      )}

      {/* Events Moderation (Home) */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="font-semibold">Events Moderation</div>
          <a href="/admin/community" className="text-sm text-emerald-700 hover:underline">View all</a>
        </div>
        {pendingEvents.length === 0 ? (
          <div className="text-slate-500 text-sm">No pending events.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {pendingEvents.map(ev => (
              <li key={ev._id} className="py-3 flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-slate-800">{ev.title}</div>
                  <div className="text-xs text-slate-500">
                    {ev.schedule?.startDate ? new Date(ev.schedule.startDate).toLocaleString() : ''}
                    {ev.organizer?.name ? ` • by ${ev.organizer.name}` : ''}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.put(`/community/admin/events/${ev._id}/approve`);
                        setPendingEvents(prev => prev.filter(e => e._id !== ev._id));
                        toast.success('Event approved');
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Approve failed');
                      }
                    }}
                    className="px-3 py-1 text-xs rounded bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        await apiClient.put(`/community/admin/events/${ev._id}/reject`, { rejectionReason: 'Rejected from dashboard' });
                        setPendingEvents(prev => prev.filter(e => e._id !== ev._id));
                        toast.success('Event rejected');
                      } catch (err) {
                        toast.error(err?.response?.data?.message || 'Reject failed');
                      }
                    }}
                    className="px-3 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700"
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </motion.div>

      {/* Charts */}
      {analytics && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* User roles pie */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-5 shadow-sm">
            <div className="font-semibold mb-3">User Roles</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie dataKey="value" data={[
                      { name: 'Farmers', value: analytics?.users?.farmers || 0 },
                      { name: 'Buyers', value: analytics?.users?.buyers || 0 },
                      { name: 'Admins', value: analytics?.users?.admins || 0 },
                    ]} outerRadius={80} label>
                    {COLORS.map((c, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top crops bar */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-5 shadow-sm">
            <div className="font-semibold mb-3">Top Listed Crops</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics?.marketplace?.topCrops || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Growth calendar trend */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 p-5 shadow-sm">
            <div className="font-semibold mb-3">Growth Calendar Trend</div>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.crops?.growthCalendarTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}