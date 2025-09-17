import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

export default function OwnerRevenue(){
  const [stats, setStats] = useState();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/owner/revenue');
        if (!cancelled) setStats(res.data?.data || res.data);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const exportCsv = () => {
    const rows = [['Date','Bookings','Revenue']];
    // Placeholder rows, replace with real timeseries if available
    rows.push([new Date().toISOString().slice(0,10), stats?.approvedBookings || 0, stats?.totalRevenue || 0]);
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'owner_revenue.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-white p-4">
        <div className="text-sm text-slate-600">Total Revenue</div>
        <div className="text-2xl font-semibold mt-1">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
      </div>
      <button className="px-3 py-2 rounded bg-emerald-600 text-white" onClick={exportCsv}>Export CSV</button>
    </div>
  );
}






