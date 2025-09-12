import React, { useEffect, useState } from 'react';
import eventsService from '../services/eventsService';

export default function Events(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventsService.list({ q, category, status: 'published' });
      setEvents(res?.events || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Events</h2>
      <div className="flex gap-2 mb-4">
        <input className="border px-3 py-2 rounded w-full" placeholder="Search" value={q} onChange={(e)=>setQ(e.target.value)} />
        <button className="px-4 py-2 bg-emerald-600 text-white rounded" onClick={load}>Search</button>
      </div>
      {loading && 'Loading...'}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(ev => (
          <div key={ev._id} className="border rounded p-3 bg-white dark:bg-slate-900">
            <div className="font-semibold">{ev.title}</div>
            <div className="text-sm text-slate-500">{new Date(ev.dateTime).toLocaleString()}</div>
            <div className="text-sm">{ev.locationDetail?.address || ev.location}</div>
            <div className="mt-2 flex gap-2">
              <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={async()=>{ await eventsService.rsvp(ev._id,'going'); alert('RSVP saved'); }}>RSVP</button>
              <a className="px-3 py-1 bg-gray-100 rounded border" href={eventsService.exportICS(ev._id)}>ICS</a>
              <a className="px-3 py-1 bg-gray-100 rounded border" href={eventsService.exportCSV(ev._id)}>CSV</a>
              <a className="px-3 py-1 bg-gray-100 rounded border" href={eventsService.exportPDF(ev._id)}>PDF</a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}