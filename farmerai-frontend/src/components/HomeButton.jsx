import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Home } from 'lucide-react';

const HomeButton = () => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      className="fixed top-4 left-4 z-50 px-4 py-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
      aria-label="Go to Home"
    >
      <Home size={20} />
    </button>
  );
};

export default HomeButton;
