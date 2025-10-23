import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home } from 'lucide-react';

const HomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  // Dashboard: floating circular FAB on the right, with glow and tooltip
  // Other pages: retain compact button on the left
  const baseClasses =
    'z-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400';
  const dashClasses =
    'fixed top-4 right-4 p-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-[0_12px_30px_-12px_rgba(16,185,129,0.5)] hover:shadow-[0_18px_40px_-12px_rgba(16,185,129,0.6)] transition-all duration-200 hover:-translate-y-0.5';
  const otherClasses =
    'fixed top-4 left-4 px-4 py-2 rounded-lg bg-green-600 text-white shadow-lg hover:bg-green-700 transition-transform hover:scale-105';

  return (
    <div className="relative">
      <button
        onClick={() => navigate('/')}
        className={`${baseClasses} ${isDashboard ? dashClasses : otherClasses}`}
        aria-label="Go to Home"
        title="Home"
      >
        <Home size={20} />
      </button>
      {isDashboard && (
        <div
          className="pointer-events-none absolute -bottom-8 right-0 text-xs bg-white/90 backdrop-blur px-2 py-1 rounded-md border border-green-100 text-gray-700 shadow-sm"
          aria-hidden
        >
          Home
        </div>
      )}
    </div>
  );
};

export default HomeButton;
