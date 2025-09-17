import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';
import RevenueChart from './components/RevenueChart';
import OccupancyChart from './components/OccupancyChart';

export default function OwnerOverview(){
  const [data, setData] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/owner/dashboard');
        if (!cancelled) setData(res.data?.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  const revenueSeries = [
    { label: 'Week 1', revenue: data?.weekly?.[0] || data?.monthlyEarnings || 0 },
    { label: 'Week 2', revenue: data?.weekly?.[1] || 0 },
    { label: 'Week 3', revenue: data?.weekly?.[2] || 0 },
    { label: 'Week 4', revenue: data?.weekly?.[3] || 0 },
  ];

  const occupancySeries = (data?.warehouses || []).map(w => ({ name: w.name, occupancy: w.occupancy || 0 }));

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-4 gap-4">
        <StatCard title="Total Warehouses" value={data?.totalWarehouses || 0} />
        <StatCard title="Active Bookings" value={data?.activeBookings || 0} />
        <StatCard title="Monthly Earnings" value={`₹${(data?.monthlyEarnings || 0).toLocaleString()}`} />
        <StatCard title="Avg Occupancy" value={`${data?.avgOccupancyPercent || 0}%`} />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <RevenueChart data={revenueSeries} />
        <OccupancyChart data={occupancySeries} />
      </div>
    </div>
  );
}

function StatCard({ title, value }){
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="text-sm text-slate-600">{title}</div>
      <div className="text-2xl font-semibold mt-1">{value}</div>
    </div>
  );
}


