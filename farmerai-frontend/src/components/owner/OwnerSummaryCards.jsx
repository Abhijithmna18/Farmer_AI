import React from 'react';

const Card = ({ title, value, icon, accent }) => (
  <div className="bg-white rounded-xl shadow p-5 flex items-center">
    <div className={`w-12 h-12 rounded-lg grid place-items-center ${accent}`}>{icon}</div>
    <div className="ml-4">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

export default function OwnerSummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card title="Total Warehouses" value={stats.totalWarehouses || 0} icon={<span>🏪</span>} accent="bg-emerald-100" />
      <Card title="Active Bookings" value={stats.activeBookings || 0} icon={<span>📦</span>} accent="bg-blue-100" />
      <Card title="Occupancy" value={`${stats.occupancyRate || 0}%`} icon={<span>🧭</span>} accent="bg-yellow-100" />
      <Card title="Monthly Earnings" value={`₹${stats.monthlyEarnings || 0}`} icon={<span>💰</span>} accent="bg-purple-100" />
    </div>
  );
}





