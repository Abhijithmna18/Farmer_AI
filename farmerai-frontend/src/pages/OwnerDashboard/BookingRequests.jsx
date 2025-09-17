import React, { useEffect, useState } from 'react';
import apiClient from '../../services/apiClient';

export default function OwnerBookings(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/owner/bookings', { params: { status: 'pending' } });
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  const act = async (id, action) => {
    try {
      await apiClient.patch(`/owner/bookings/${id}/${action}`);
      await load();
    } catch (e) {
      alert(e?.response?.data?.message || 'Failed');
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {items.map(b => (
        <div key={b._id} className="rounded-xl border bg-white p-4">
          <div className="font-medium">{b.warehouse?.name}</div>
          <div className="text-sm text-slate-600">{b.produce?.type} • {b.produce?.quantity} {b.produce?.unit}</div>
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 rounded bg-emerald-600 text-white" onClick={() => act(b._id, 'approve')}>Approve</button>
            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={() => act(b._id, 'reject')}>Reject</button>
          </div>
        </div>
      ))}
      {items.length === 0 && <div>No pending requests.</div>}
    </div>
  );
}






