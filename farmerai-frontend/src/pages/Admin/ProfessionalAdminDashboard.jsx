// src/pages/Admin/ProfessionalAdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  UsersIcon,
  BuildingOfficeIcon,
  CalendarIcon,
  CurrencyRupeeIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

const StatCard = ({ title, value, change, icon: Icon, trend, color = 'emerald' }) => {
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${colorClasses[color]} shadow-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
              change >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {change >= 0 ? (
                <ArrowTrendingUpIcon className="h-3 w-3" />
              ) : (
                <ArrowTrendingDownIcon className="h-3 w-3" />
              )}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <p className="text-xs text-gray-500 mt-2">{trend}</p>
          )}
        </div>
      </div>
      <div className={`h-1 bg-gradient-to-r ${colorClasses[color]}`}></div>
    </motion.div>
  );
};

export default function ProfessionalAdminDashboard() {
  const { user } = useAuth();
  const [overview, setOverview] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [range, setRange] = useState('7d');
  const [warehouseStats, setWarehouseStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is admin
  const isAdmin = user && (user.role === 'admin' || (Array.isArray(user.roles) && user.roles.includes('admin')));
  
  console.log('User:', user);
  console.log('Is Admin:', isAdmin);

  // Direct fetch function for admin stats
  const fetchAdminStats = async () => {
    try {
      console.log('Fetching admin stats using apiClient...');
      
      // Use apiClient instead of direct fetch
      const response = await apiClient.get('/admin/stats');
      
      console.log('API call successful:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  const loadData = async (r) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is admin
      if (!isAdmin) {
        console.warn('User is not an admin');
        setError('Access denied. Admin privileges required.');
        // Set default values
        setOverview({ totalUsers: 0 });
        setWarehouseStats({ activeWarehouses: 0, pendingWarehouses: 0, inactiveWarehouses: 0 });
        setBookingStats({ totalBookings: 0, completedBookings: 0, pendingBookings: 0, cancelledBookings: 0 });
        setPaymentStats({ totalAmount: 0 });
        setLoading(false);
        return;
      }
      
      // Try apiClient fetch
      try {
        const statsData = await fetchAdminStats();
        console.log('Stats data received:', statsData);
        setOverview(statsData);
        
        // Set other stats based on the data we received
        setWarehouseStats({
          activeWarehouses: statsData.totalWarehouses || 0,
          pendingWarehouses: statsData.pendingApprovals || 0,
          inactiveWarehouses: 0 // We don't have this data directly
        });
        
        setBookingStats({
          totalBookings: statsData.totalBookings || 0,
          completedBookings: statsData.completedBookings || 0,
          pendingBookings: statsData.activeBookings ? (statsData.totalBookings - statsData.completedBookings) : 0,
          cancelledBookings: 0 // We don't have this data directly
        });
        
        setPaymentStats({
          totalAmount: statsData.totalRevenue || 0
        });
      } catch (apiError) {
        console.error('API call failed:', apiError);
        setError('Failed to load dashboard data. Please try again.');
        
        // Fallback to default values
        setOverview({ totalUsers: 0 });
        setWarehouseStats({ activeWarehouses: 0, pendingWarehouses: 0, inactiveWarehouses: 0 });
        setBookingStats({ totalBookings: 0, completedBookings: 0, pendingBookings: 0, cancelledBookings: 0 });
        setPaymentStats({ totalAmount: 0 });
      }

      // Load pending events using apiClient
      try {
        console.log('Fetching pending events using apiClient...');
        const evResponse = await apiClient.get('/community/events/pending');
        
        console.log('Events data received:', evResponse.data);
        setPendingEvents(evResponse.data?.data?.events || evResponse.data.events || []);
      } catch (e) {
        console.warn('Events not available:', e);
        setPendingEvents([]);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setError('Failed to load dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(range);
  }, [range, isAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  // Show message if user is not admin
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Access Denied</div>
          <p className="text-gray-600">You must be logged in as an administrator to view this dashboard.</p>
          <p className="text-gray-500 mt-2">Please log in with admin credentials.</p>
          {user && <p className="text-gray-400 mt-4">Current role: {user.role || (Array.isArray(user.roles) ? user.roles.join(', ') : 'None')}</p>}
        </div>
      </div>
    );
  }

  // Show error message if there was an error loading data
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600 mb-4">Error Loading Dashboard</div>
          <p className="text-gray-600">{error}</p>
          <button 
            onClick={() => loadData(range)}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Debug info
  console.log('Dashboard State:', {
    overview,
    warehouseStats,
    bookingStats,
    paymentStats,
    pendingEvents
  });

  const stats = [
    {
      title: 'Total Users',
      value: overview?.totalUsers || 0,
      change: overview?.userGrowth || 12.5,
      icon: UsersIcon,
      color: 'emerald',
      trend: 'vs last month'
    },
    {
      title: 'Active Warehouses',
      value: warehouseStats?.activeWarehouses || 0,
      change: 8.2,
      icon: BuildingOfficeIcon,
      color: 'blue',
      trend: 'Currently active'
    },
    {
      title: 'Total Bookings',
      value: bookingStats?.totalBookings || 0,
      change: 15.3,
      icon: CalendarIcon,
      color: 'purple',
      trend: 'All time bookings'
    },
    {
      title: 'Total Revenue',
      value: `₹${(paymentStats?.totalAmount || 0).toLocaleString()}`,
      change: 23.1,
      icon: CurrencyRupeeIcon,
      color: 'orange',
      trend: 'Total earnings'
    },
    {
      title: 'Pending Approvals',
      value: warehouseStats?.pendingWarehouses || 0,
      icon: ClockIcon,
      color: 'pink',
      trend: 'Requires action'
    },
    {
      title: 'Completed Bookings',
      value: bookingStats?.completedBookings || 0,
      change: 5.7,
      icon: CheckCircleIcon,
      color: 'indigo',
      trend: 'Successfully completed'
    }
  ];

  // Sample data for charts
  const revenueData = [
    { month: 'Jan', revenue: 12000 },
    { month: 'Feb', revenue: 19000 },
    { month: 'Mar', revenue: 15000 },
    { month: 'Apr', revenue: 25000 },
    { month: 'May', revenue: 22000 },
    { month: 'Jun', revenue: 30000 }
  ];

  const bookingStatusData = [
    { name: 'Completed', value: bookingStats?.completedBookings || 0 },
    { name: 'Pending', value: bookingStats?.pendingBookings || 0 },
    { name: 'Cancelled', value: bookingStats?.cancelledBookings || 0 }
  ];

  const warehouseData = [
    { name: 'Active', value: warehouseStats?.activeWarehouses || 0 },
    { name: 'Inactive', value: warehouseStats?.inactiveWarehouses || 0 },
    { name: 'Pending', value: warehouseStats?.pendingWarehouses || 0 }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Welcome back! Here's what's happening with your platform.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className="px-4 py-2 rounded-xl border-2 border-gray-200 bg-white font-medium text-gray-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Trend */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Revenue Trend</h3>
              <ChartBarIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Booking Status Distribution */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Booking Status</h3>
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Warehouse Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Warehouse Status</h3>
              <BuildingOfficeIcon className="h-6 w-6 text-purple-600" />
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={warehouseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" />
                <YAxis stroke="#6b7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="value" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Recent Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900">Pending Approvals</h3>
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            {pendingEvents.length === 0 ? (
              <div className="text-slate-500 text-sm">No pending events.</div>
            ) : (
              <ul className="divide-y divide-slate-200">
                {pendingEvents.map(event => (
                  <li key={event._id} className="py-3 flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-800">{event.title}</div>
                      <div className="text-xs text-slate-500">
                        {event.schedule?.startDate ? new Date(event.schedule.startDate).toLocaleString() : ''}
                        {event.organizer?.name ? ` • by ${event.organizer.name}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          try {
                            // Use apiClient instead of direct fetch
                            await apiClient.put(`/community/admin/events/${event._id}/approve`);
                            setPendingEvents(prev => prev.filter(e => e._id !== event._id));
                            toast.success('Event approved');
                            // Reload data to update stats
                            loadData(range);
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
                            // Use apiClient instead of direct fetch
                            await apiClient.put(`/community/admin/events/${event._id}/reject`, { 
                              rejectionReason: 'Rejected from dashboard' 
                            });
                            setPendingEvents(prev => prev.filter(e => e._id !== event._id));
                            toast.success('Event rejected');
                            // Reload data to update stats
                            loadData(range);
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
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl shadow-xl p-8 text-white"
        >
          <h3 className="text-2xl font-bold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <a href="/admin/dashboard/users" className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
              <UsersIcon className="h-8 w-8 mb-2" />
              <p className="font-semibold">Manage Users</p>
            </a>
            <a href="/admin/warehouse" className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
              <BuildingOfficeIcon className="h-8 w-8 mb-2" />
              <p className="font-semibold">Warehouses</p>
            </a>
            <a href="/admin/community" className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
              <CalendarIcon className="h-8 w-8 mb-2" />
              <p className="font-semibold">Events</p>
            </a>
            <a href="/admin/dashboard/settings" className="bg-white/20 backdrop-blur rounded-xl p-4 hover:bg-white/30 transition-all">
              <ChartBarIcon className="h-8 w-8 mb-2" />
              <p className="font-semibold">Analytics</p>
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  );
}