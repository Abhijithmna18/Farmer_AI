import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      title: 'Add Warehouse',
      description: 'List a new warehouse for rent',
      icon: '🏪',
      color: 'bg-emerald-500',
      onClick: () => navigate('/owner/warehouses?new=1')
    },
    {
      title: 'View Bookings',
      description: 'Manage incoming booking requests',
      icon: '📦',
      color: 'bg-blue-500',
      onClick: () => navigate('/owner/bookings')
    },
    {
      title: 'Revenue Reports',
      description: 'View earnings and analytics',
      icon: '💰',
      color: 'bg-green-500',
      onClick: () => navigate('/owner/revenue')
    },
    {
      title: 'Customer Support',
      description: 'Help and support center',
      icon: '🎧',
      color: 'bg-purple-500',
      onClick: () => navigate('/owner/settings')
    }
  ];

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, index) => (
          <button
            key={index}
            onClick={action.onClick}
            className="p-4 rounded-lg border hover:shadow-md transition-all duration-200 text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center text-white text-xl group-hover:scale-110 transition-transform`}>
                {action.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{action.title}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}



