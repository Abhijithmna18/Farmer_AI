import React, { useState, useContext } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { AuthContext } from '../../../context/AuthContext';
import { firebaseSignOut } from '../../../services/authService';

const navItems = [
  { label: 'Dashboard', to: '/admin/dashboard', icon: '🏠' },
  { label: 'Users', to: '/admin/dashboard/users', icon: '👥' },
  { label: 'Products', to: '/admin/dashboard/products', icon: '🧺' },
  { label: 'Events', to: '/admin/dashboard/events', icon: '📅' },
  { label: 'Growth Calendar', to: '/admin/dashboard/calendar', icon: '🌱' },
  { label: 'Contact Messages', to: '/admin/dashboard/contacts', icon: '✉️' },
  { label: 'Settings', to: '/admin/dashboard/settings', icon: '⚙️' },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

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
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <button className="md:hidden px-3 py-2 rounded-lg border" onClick={() => setOpen(v => !v)}>☰</button>
          <div className="font-semibold text-slate-800">Admin Console</div>
          <div className="flex items-center gap-3">
            <button className="px-3 py-2 text-sm rounded-lg bg-white border shadow-sm">🔔</button>
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
                {n.label}
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