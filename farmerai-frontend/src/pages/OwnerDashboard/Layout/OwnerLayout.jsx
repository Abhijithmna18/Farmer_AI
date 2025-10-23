import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import ThemeToggle from '../../../components/ThemeToggle';
import useAuth from '../../../hooks/useAuth';

const navItems = [
  { label: 'Dashboard', to: '/owner/dashboard', icon: '🏠' },
  { label: 'Warehouses', to: '/owner/warehouses', icon: '🏪' },
  { label: 'Bookings', to: '/owner/bookings', icon: '📦' },
  { label: 'Inventory', to: '/owner/inventory', icon: '📋' },
  { label: 'Analytics', to: '/owner/analytics', icon: '📊' },
  { label: 'Reports', to: '/owner/reports', icon: '📈' },
  { label: 'Revenue', to: '/owner/revenue', icon: '💰' },
  { label: 'Settings', to: '/owner/settings', icon: '⚙️' },
];

export default function OwnerLayout() {
  const [open, setOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    // Track location changes for debugging if needed
  }, [location]);

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
                <div className="text-xl font-semibold">
                  {user?.firstName && user?.lastName 
                    ? `${user.firstName} ${user.lastName}` 
                    : user?.displayName || user?.name || user?.email?.split('@')[0] || "Warehouse Owner"
                  }
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle variant="icon" size="md" className="bg-white/20 text-white hover:bg-white/30" />
              <button
                className="text-emerald-700 bg-white px-3 py-2 rounded-lg border border-white/30 hover:bg-white/90"
                onClick={() => navigate('/owner/warehouses?new=1')}
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
              <button 
                className="md:hidden text-white/95 px-3 py-2 rounded-lg border border-white/30 hover:bg-white/10" 
                onClick={() => setOpen(o => !o)}
              >
                {open ? 'Hide Menu' : 'Show Menu'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="max-w-7xl mx-auto grid md:grid-cols-[240px_1fr] gap-6 px-4 py-6">
        <motion.aside 
          initial={{ x: -20, opacity: 0 }} 
          animate={{ x: 0, opacity: 1 }} 
          transition={{ duration: 0.25 }} 
          className={`fixed md:relative z-50 md:z-auto top-0 left-0 h-full w-64 md:w-auto md:h-max md:sticky md:top-20 ${
            open ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm overflow-hidden h-full md:h-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Navigation</h2>
              <button 
                className="md:hidden text-slate-400 hover:text-slate-600"
                onClick={() => setOpen(false)}
              >
                ✕
              </button>
            </div>
            <nav className="py-2">
              {navItems.map(n => (
                <NavLink 
                  key={n.to} 
                  to={n.to}
                  onClick={() => {
                    // Close mobile sidebar when navigating
                    if (window.innerWidth < 768) {
                      setOpen(false);
                    }
                  }}
                  className={({ isActive }) => 
                    `flex items-center gap-3 px-4 py-3 text-sm transition-all duration-200 ${
                      isActive 
                        ? 'bg-emerald-50 text-emerald-700 font-medium border-r-2 border-emerald-500' 
                        : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900'
                    }`
                  }
                >
                  <span className="text-lg">{n.icon}</span>
                  <span className="flex-1">{n.label}</span>
                  {n.to === '/owner/bookings' && (
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">3</span>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="p-4 border-t border-slate-200">
              <div className="text-xs text-slate-500">
                Last updated: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </motion.aside>

        <motion.main initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
}


