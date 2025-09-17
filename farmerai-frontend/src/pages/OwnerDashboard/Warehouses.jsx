import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import apiClient from '../../services/apiClient';

export default function OwnerWarehouses(){
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const showNewForm = useMemo(() => searchParams.get('new') === '1', [searchParams]);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    capacityValue: '',
    capacityUnit: 'tons',
    type: 'cold-storage',
    pricePerDay: '',
    amenities: ''
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/owner/warehouses');
      setItems(res.data?.data || []);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to fetch');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      {showNewForm && (
        <div className="rounded-xl border bg-white p-4">
          <div className="text-lg font-medium mb-3">Add New Warehouse</div>
          <div className="grid md:grid-cols-2 gap-4">
            <Input label="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Price Per Day (₹)" type="number" value={form.pricePerDay} onChange={e => setForm({ ...form, pricePerDay: e.target.value })} />
            <Input label="Address" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input label="Capacity" type="number" value={form.capacityValue} onChange={e => setForm({ ...form, capacityValue: e.target.value })} />
              <Select label="Unit" value={form.capacityUnit} onChange={e => setForm({ ...form, capacityUnit: e.target.value })} options={[{v:'kg',l:'kg'},{v:'tons',l:'tons'},{v:'quintals',l:'quintals'},{v:'bags',l:'bags'}]} />
            </div>
            <Select label="Type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} options={[{v:'cold-storage',l:'Cold Storage'},{v:'dry-storage',l:'Dry Storage'},{v:'container',l:'Container'}]} />
            <Input label="Amenities (comma separated)" value={form.amenities} onChange={e => setForm({ ...form, amenities: e.target.value })} />
          </div>
          <div className="mt-4 flex gap-3">
            <button
              className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await apiClient.post('/owner/warehouses', {
                    name: form.name,
                    location: { address: form.address },
                    capacity: { value: Number(form.capacityValue), unit: form.capacityUnit },
                    pricing: { pricePerDay: Number(form.pricePerDay) },
                    type: form.type,
                    amenities: form.amenities.split(',').map(a => a.trim()).filter(Boolean)
                  });
                  await load();
                  // close form
                  setSearchParams(params => { params.delete('new'); return params; });
                  setForm({ name: '', address: '', capacityValue: '', capacityUnit: 'tons', type: 'cold-storage', pricePerDay: '', amenities: '' });
                } catch (e) {
                  alert(e?.response?.data?.message || 'Failed to create');
                } finally {
                  setSaving(false);
                }
              }}
            >Save</button>
            <button
              className="px-3 py-2 rounded border"
              onClick={() => setSearchParams(params => { params.delete('new'); return params; })}
            >Cancel</button>
          </div>
        </div>
      )}
      {items.map(w => (
        <div key={w._id} className="rounded-xl border bg-white p-4">
          <div className="font-medium">{w.name}</div>
          <div className="text-sm text-slate-600">{w.location?.address}</div>
          <div className="text-sm">Capacity: {w.capacity?.value} {w.capacity?.unit}</div>
        </div>
      ))}
      {items.length === 0 && <div>No warehouses yet.</div>}
    </div>
  );
}

function Input({ label, ...props }){
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <input className="w-full border rounded px-3 py-2" {...props} />
    </label>
  );
}

function Select({ label, options = [], ...props }){
  return (
    <label className="block">
      <div className="text-sm text-slate-600 mb-1">{label}</div>
      <select className="w-full border rounded px-3 py-2" {...props}>
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}


