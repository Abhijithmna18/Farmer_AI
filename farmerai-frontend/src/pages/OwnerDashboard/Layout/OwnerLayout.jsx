import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const navItems = [
  { label: 'Dashboard', to: 'dashboard', icon: '🏠' },
  { label: 'Warehouses', to: 'warehouses', icon: '🏪' },
  { label: 'Bookings', to: 'bookings', icon: '📦' },
  { label: 'Revenue', to: 'revenue', icon: '💰' },
  { label: 'Settings', to: 'settings', icon: '⚙️' },
];

export default function OwnerLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('roles');
      localStorage.removeItem('userType');
      localStorage.removeItem('email');
      localStorage.removeItem('userId');
    } catch (_) {}
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-emerald-600 to-lime-600">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <span className="text-2xl">🏪</span>
              <div>
                <div className="text-sm opacity-90">FarmerAI Console</div>
                <div className="text-xl font-semibold">Warehouse Owner</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                className="text-emerald-700 bg-white px-3 py-2 rounded-lg border border-white/30 hover:bg-white/90"
                onClick={() => navigate('warehouses?new=1')}
              >
                + Add Warehouse
              </button>
              <button
                className="text-white/95 px-3 py-2 rounded-lg border border-white/30 hover:bg-white/10"
                onClick={handleLogout}
                title="Logout"
              >
                Logout
              </button>
              <button className="text-white/95 px-3 py-2 rounded-lg border border-white/30 hover:bg-white/10" onClick={() => setOpen(o => !o)}>
                {open ? 'Hide Menu' : 'Show Menu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] gap-6 px-4 py-6">
        <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 0.25 }} className={`md:sticky md:top-20 h-max ${open ? 'block' : 'hidden md:block'}`}>
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm overflow-hidden">
            {navItems.map(n => (
              <NavLink key={n.to} to={n.to} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 text-sm border-b last:border-0 ${isActive ? 'bg-emerald-50 text-emerald-700 font-medium' : 'hover:bg-slate-50'}`}>
                <span>{n.icon}</span>
                <span className="flex-1">{n.label}</span>
              </NavLink>
            ))}
          </div>
        </motion.aside>

        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}


