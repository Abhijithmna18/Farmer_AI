import React, { useEffect, useMemo, useState } from 'react';
import marketplaceService from '../../services/marketplaceService';

export default function Marketplace(){
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const data = await marketplaceService.getProducts({ search: query, category });
      setProducts(data?.products || []);
    } catch (e) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4">
      <div className="flex gap-2 mb-4">
        <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search..." className="border px-3 py-2 rounded w-full" />
        <button onClick={load} className="px-4 py-2 bg-green-600 text-white rounded">Search</button>
      </div>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p._id} className="border rounded p-3 bg-white dark:bg-slate-900">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-sm text-slate-500">{p.category}</div>
            <div className="mt-2 font-bold">₹{p.price} / {p.unit}</div>
            <div className="mt-2 text-sm">{p.isAvailable ? 'Available' : 'Unavailable'}</div>
            <button onClick={async ()=>{
              await marketplaceService.addToCart({ productId: p._id, quantity: 1 });
              alert('Added to cart');
            }} className="mt-3 px-3 py-2 bg-emerald-600 text-white rounded">Add to cart</button>
          </div>
        ))}
      </div>
    </div>
  );
}
