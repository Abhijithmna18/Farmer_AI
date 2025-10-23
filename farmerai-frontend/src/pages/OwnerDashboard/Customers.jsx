import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

export default function OwnerCustomers(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiClient.get('/owner/customers');
        if (!cancelled) setItems(res.data?.data || []);
      } catch (e) {
        if (!cancelled) setError(e?.response?.data?.message || 'Failed to load customers');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {items.map(c => (
        <div key={c.farmerId} className="rounded-xl border bg-white p-4 flex items-center justify-between">
          <div>
            <div className="font-medium">{c.name || 'Unnamed'}</div>
            <div className="text-sm text-slate-600">{c.email} • {c.phone}</div>
          </div>
          <div className="text-right">
            <div className="text-sm">Bookings: {c.bookings}</div>
            <div className="text-xs text-slate-500">Last: {c.lastBookingAt ? new Date(c.lastBookingAt).toLocaleDateString() : '-'}</div>
          </div>
        </div>
      ))}
      {items.length === 0 && <div>No customers yet.</div>}
    </div>
  );
}







