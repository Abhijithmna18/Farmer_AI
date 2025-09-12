import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import apiClient from '../../../services/apiClient';

function useTable(data) {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data || []).filter((e) => [e.name, e.email, e.subject, e.message].some(v => String(v||'').toLowerCase().includes(s)));
  }, [data, q]);
  const total = filtered.length;
  const start = (page-1)*rows;
  const pageData = filtered.slice(start, start+rows);
  return { q, setQ, page, setPage, rows, setRows, total, pageData };
}

export default function ContactsPage() {
  const [items, setItems] = useState([]);
  const { q, setQ, page, setPage, rows, setRows, total, pageData } = useTable(items);

  const load = async () => {
    try {
      const { data } = await apiClient.get('/admin/contacts');
      setItems(data);
    } catch {
      toast.error('Failed to load messages');
    }
  };

  useEffect(() => { load(); }, []);

  const del = async (id) => {
    if (!confirm('Delete this message?')) return;
    try { await apiClient.delete(`/admin/contacts/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Contact Messages</h2>
          <p className="text-slate-500">View and delete incoming messages</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search" className="px-3 py-2 border rounded-lg" />
          <select value={rows} onChange={e=>{setRows(+e.target.value); setPage(1);}} className="px-2 py-2 border rounded-lg">
            {[10,20,50].map(n=> <option key={n} value={n}>{n}/page</option>)}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white/70 backdrop-blur border border-slate-200 shadow-sm overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-3">From</th>
              <th className="text-left px-4 py-3">Subject</th>
              <th className="text-left px-4 py-3">Message</th>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-right px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(e => (
              <tr key={e._id} className="border-t">
                <td className="px-4 py-2">{e.name} <span className="text-slate-400">({e.email})</span></td>
                <td className="px-4 py-2">{e.subject || '-'}</td>
                <td className="px-4 py-2 max-w-xl truncate" title={e.message}>{e.message}</td>
                <td className="px-4 py-2">{new Date(e.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-right space-x-2">
                  <button className="px-2 py-1 text-xs rounded bg-red-100" onClick={() => del(e._id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div>Showing {(page-1)*rows+1}-{Math.min(page*rows, total)} of {total}</div>
        <div className="flex gap-2">
          <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="px-3 py-1 border rounded disabled:opacity-50">Prev</button>
          <button disabled={page*rows>=total} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 border rounded disabled:opacity-50">Next</button>
        </div>
      </div>
    </div>
  );
}