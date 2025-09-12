import React, { useEffect, useState } from 'react';
import eventsService from '../../../services/eventsService';

export default function EventsPage(){
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await eventsService.list({ status: 'pending' });
      setEvents(res?.events || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const moderate = async (id, status) => {
    await eventsService.changeStatus(id, status);
    load();
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Events Moderation</h2>
      {loading && 'Loading...'}
      <div className="space-y-3">
        {events.map(ev => (
          <div key={ev._id} className="border rounded p-3 bg-white dark:bg-slate-900 flex items-center justify-between">
            <div>
              <div className="font-semibold">{ev.title}</div>
              <div className="text-sm text-slate-500">{new Date(ev.dateTime).toLocaleString()} • {ev.locationDetail?.address || ev.location}</div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1 bg-emerald-600 text-white rounded" onClick={()=>moderate(ev._id,'published')}>Publish</button>
              <button className="px-3 py-1 bg-yellow-600 text-white rounded" onClick={()=>moderate(ev._id,'verified')}>Verify</button>
              <button className="px-3 py-1 bg-red-600 text-white rounded" onClick={()=>moderate(ev._id,'rejected')}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}