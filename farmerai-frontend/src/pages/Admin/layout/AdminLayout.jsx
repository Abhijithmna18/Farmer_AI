import React, { useState, useContext, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AuthContext } from '../../../context/AuthContext';
import { firebaseSignOut } from '../../../services/authService';
import apiClient from '../../../services/apiClient';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠' },
  { label: 'Users', to: '/admin/dashboard/users', icon: '👥' },
  { label: 'Community Requests', to: '/admin/community-requests', icon: '🤝', badge: 'community-requests' },
  { label: 'Feedback', to: '/admin/feedback', icon: '💬', badge: 'feedback' },
  { label: 'Products', to: '/admin/dashboard/products', icon: '🧺' },
  { label: 'Events', to: '/admin/dashboard/events', icon: '📅' },
  { label: 'Growth Calendar', to: '/admin/growth-calendar', icon: '🌱' },
  { label: 'Warehouse', to: '/admin/warehouse', icon: '🏪' },
  { label: 'Contact Messages', to: '/admin/dashboard/contacts', icon: '✉️' },
  { label: 'Settings', to: '/admin/dashboard/settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingFeedbackCount, setPendingFeedbackCount] = useState(0);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Load pending counts
  useEffect(() => {
    const loadPendingCounts = async () => {
      try {
        // Load community requests count
        const requestsResponse = await apiClient.get('/community/admin/community-requests?status=pending&limit=1');
        setPendingRequestsCount(requestsResponse.data.counts?.pending || 0);

        // Load feedback count
        const feedbackResponse = await apiClient.get('/feedback/admin/all?status=Received&limit=1');
        setPendingFeedbackCount(feedbackResponse.data.counts?.received || 0);
      } catch (error) {
        console.error('Error loading pending counts:', error);
        // Don't show error to user, just set counts to 0
        setPendingRequestsCount(0);
        setPendingFeedbackCount(0);
      }
    };

    if (user && user.role === 'admin') {
      loadPendingCounts();
    }
  }, [user]);

  const handleLogout = async () => {
    try {
      await firebaseSignOut();
      navigate('/login');
    } catch {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <Toaster position="top-right" />

      {/* Top bar */}
      <div className="sticky top-0 z-30 backdrop-blur bg-white/70 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <button aria-label="Toggle navigation" className="md:hidden px-3 py-2 rounded-lg border" onClick={() => setOpen(v => !v)}>☰</button>
          <div className="font-semibold text-slate-800">Admin Console</div>
          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-xl ml-4">
            <div className="relative w-full">
              <input
                type="search"
                placeholder="Search users, warehouses, bookings..."
                className="w-full px-3 py-2 pl-9 rounded-lg border bg-white text-slate-700 placeholder-slate-400 focus:ring-2 focus:ring-emerald-300 focus:border-emerald-300"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Notifications with badge */}
            <div className="relative">
              <button aria-label="Notifications" className="px-3 py-2 text-sm rounded-lg bg-white border shadow-sm">🔔</button>
              {(pendingRequestsCount + pendingFeedbackCount) > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5">
                  {Math.min(99, pendingRequestsCount + pendingFeedbackCount)}
                </span>
              )}
            </div>
            <button onClick={handleLogout} className="px-3 py-2 text-sm rounded-lg bg-red-50 text-red-600 border border-red-200">Logout</button>
            <div className="w-9 h-9 rounded-full bg-emerald-200 grid place-items-center" title={user?.email || 'Admin'}>
              {(user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.name || user?.email || 'A')[0].toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] gap-6 px-4 py-6">
        {/* Sidebar */}
        <motion.aside
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className={`md:sticky md:top-20 h-max ${open ? 'block' : 'hidden md:block'}`}
        >
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm overflow-hidden">
            {navItems.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm border-b last:border-0 ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-slate-50'}`}>
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
                {n.badge === 'community-requests' && pendingRequestsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {pendingRequestsCount}
                  </span>
                )}
                {n.badge === 'feedback' && pendingFeedbackCount > 0 && (
                  <span className="bg-orange-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                    {pendingFeedbackCount}
                  </span>
                )}
              </NavLink>
            ))}
          </div>
        </motion.aside>

        {/* Main content */}
        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}