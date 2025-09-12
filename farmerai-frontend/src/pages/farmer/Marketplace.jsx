import React, { useEffect, useState } from 'react';
import marketplaceService from '../../services/marketplaceService';
import useAuth from '../../hooks/useAuth';

export default function FarmerMarketplace(){
  const { user } = useAuth();
  const [data, setData] = useState({ products: [], pagination: {} });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await marketplaceService.getFarmerProducts(user.id || user._id);
      setData(res || { products: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [user]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Farmer Marketplace</h2>
      <p className="text-sm text-slate-600 mb-4">Manage your product listings.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(data.products || []).map(p => (
          <div key={p._id} className="border rounded p-3 bg-white dark:bg-slate-900">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-slate-500">{p.category}</div>
            <div className="mt-1">₹{p.price} / {p.unit}</div>
            <div className="text-sm mt-1">Stock: {p.stock}</div>
            <div className="text-xs text-slate-500 mt-1">Status: {p.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
