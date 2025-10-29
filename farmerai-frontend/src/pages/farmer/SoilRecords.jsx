import React, { useEffect, useState } from 'react';
import soilService from '../../services/soilService';
import { toast } from 'react-hot-toast';

export default function SoilRecords(){
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({ sampleDate: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', texture: 'loamy' });

  const handleBlockSpaceEnter = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
    }
  };

  const load = async () => {
    const data = await soilService.list();
    setItems(data?.items || []);
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    const { sampleDate, ph, nitrogen, phosphorus, potassium, texture } = form;
    if (!sampleDate) { toast.error('Please select a sample date.'); return; }
    if ([ph, nitrogen, phosphorus, potassium].some(v => String(v).trim() === '')) {
      toast.error('Please fill all numeric fields (no spaces/empty).');
      return;
    }
    await soilService.create({ sampleDate: new Date(sampleDate), ph, nitrogen, phosphorus, potassium, texture });
    setForm({ sampleDate: '', ph: '', nitrogen: '', phosphorus: '', potassium: '', texture: 'loamy' });
    load();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Soil Records</h2>
      <form onSubmit={create} className="border rounded p-3 mb-4 grid gap-2">
        <input type="date" className="border px-3 py-2 rounded" value={form.sampleDate} onChange={(e)=>setForm({...form, sampleDate: e.target.value})} />
        <input className="border px-3 py-2 rounded" placeholder="pH" value={form.ph} onChange={(e)=>setForm({...form, ph: e.target.value.replace(/[^\d.]/g,'')})} onKeyDown={handleBlockSpaceEnter} />
        <input className="border px-3 py-2 rounded" placeholder="Nitrogen (ppm)" value={form.nitrogen} onChange={(e)=>setForm({...form, nitrogen: e.target.value.replace(/[^\d.]/g,'')})} onKeyDown={handleBlockSpaceEnter} />
        <input className="border px-3 py-2 rounded" placeholder="Phosphorus (ppm)" value={form.phosphorus} onChange={(e)=>setForm({...form, phosphorus: e.target.value.replace(/[^\d.]/g,'')})} onKeyDown={handleBlockSpaceEnter} />
        <input className="border px-3 py-2 rounded" placeholder="Potassium (ppm)" value={form.potassium} onChange={(e)=>setForm({...form, potassium: e.target.value.replace(/[^\d.]/g,'')})} onKeyDown={handleBlockSpaceEnter} />
        <select className="border px-3 py-2 rounded" value={form.texture} onChange={(e)=>setForm({...form, texture: e.target.value})}>
          <option value="loamy">Loamy</option>
          <option value="sandy">Sandy</option>
          <option value="clay">Clay</option>
          <option value="silt">Silt</option>
          <option value="peat">Peat</option>
          <option value="chalky">Chalky</option>
          <option value="other">Other</option>
        </select>
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" type="submit">Add Record</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(r => (
          <div key={r._id} className="border rounded p-3 bg-white dark:bg-slate-900">
            <div className="font-semibold">{new Date(r.sampleDate).toLocaleDateString()}</div>
            <div className="text-sm">pH: {r.ph ?? '-'}</div>
            <div className="text-sm">Texture: {r.texture}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
