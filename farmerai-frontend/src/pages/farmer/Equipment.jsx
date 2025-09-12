import React, { useEffect, useState } from 'react';
import equipmentService from '../../services/equipmentService';
import useAuth from '../../hooks/useAuth';

export default function Equipment(){
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ title: '', type: '', mode: 'rent', pricePerDay: 0, sellPrice: 0 });

  const load = async () => {
    const data = await equipmentService.ownerInventory(user?._id || user?.id);
    setItems(data || []);
  };

  useEffect(() => { if (user) load(); }, [user]);

  const create = async (e) => {
    e.preventDefault();
    await equipmentService.create(form);
    setForm({ title: '', type: '', mode: 'rent', pricePerDay: 0, sellPrice: 0 });
    load();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">My Equipment</h2>
      <form onSubmit={create} className="border rounded p-3 mb-4 grid gap-2">
        <input className="border px-3 py-2 rounded" placeholder="Title" value={form.title} onChange={(e)=>setForm({...form, title: e.target.value})} />
        <input className="border px-3 py-2 rounded" placeholder="Type (tractor, pump...)" value={form.type} onChange={(e)=>setForm({...form, type: e.target.value})} />
        <select className="border px-3 py-2 rounded" value={form.mode} onChange={(e)=>setForm({...form, mode: e.target.value})}>
          <option value="rent">Rent</option>
          <option value="sell">Sell</option>
        </select>
        {form.mode === 'rent' ? (
          <input type="number" className="border px-3 py-2 rounded" placeholder="Price per day" value={form.pricePerDay} onChange={(e)=>setForm({...form, pricePerDay: Number(e.target.value)})} />
        ) : (
          <input type="number" className="border px-3 py-2 rounded" placeholder="Sell price" value={form.sellPrice} onChange={(e)=>setForm({...form, sellPrice: Number(e.target.value)})} />
        )}
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" type="submit">Create</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(it => (
          <div key={it._id} className="border rounded p-3">
            <div className="font-semibold">{it.title}</div>
            <div className="text-sm text-slate-500">{it.type} • {it.mode}</div>
            <div className="mt-1 text-sm">Status: {it.status}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
