import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Calendar as CalIcon, MapPin, Clock, Edit, Trash2, Download, Image as ImageIcon, Star, Users, X } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import EventForm from '../../../components/admin/EventForm';
import UpcomingEventsManager from '../../../components/admin/UpcomingEventsManager';
import * as XLSX from 'xlsx';

export default function EventsPage(){
  const [activeTab, setActiveTab] = useState('all'); // 'all' or 'upcoming'
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = { page, limit, q: search };
      const { data } = await apiClient.get('/admin/events', { params });
      setEvents(Array.isArray(data) ? data : (data?.events || data?.data || []));
      const p = data?.pagination;
      setTotal(p?.total || data?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEvents(); }, [page, search]);

  const openCreate = () => { setEditing(null); setShowModal(true); };
  const openEdit = (ev) => { setEditing({ _id: ev._id, ...formatToForm(ev) }); setShowModal(true); };

  const formatToForm = (ev) => ({
    title: ev.title,
    description: ev.description,
    location: ev.location,
    date: ev.dateTime ? new Date(ev.dateTime).toISOString().slice(0,10) : '',
    time: ev.dateTime ? new Date(ev.dateTime).toISOString().slice(11,16) : '',
    imageUrl: ev.images?.[0]?.url || '',
    registrationLink: ev.registrationLink || ''
  });

  const handleSave = async (values) => {
    try {
      setSubmitting(true);
      if (editing?._id) {
        await apiClient.put(`/admin/events/${editing._id}`, values);
        toast.success('Event updated');
      } else {
        await apiClient.post('/admin/events', values);
        toast.success('Event created');
      }
      setShowModal(false);
      fetchEvents();
    } catch (e) {
      toast.error('Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return;
    try {
      await apiClient.delete(`/admin/events/${id}`);
      toast.success('Event deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const exportCSV = () => {
    const rows = events.map(e => ({
      title: e.title,
      dateTime: new Date(e.dateTime).toLocaleString(),
      location: e.location,
      registrationLink: e.registrationLink || ''
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Events');
    XLSX.writeFile(wb, 'events.csv');
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Create, edit, and manage public events</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('all')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'all'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            All Events
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <CalIcon className="w-4 h-4" />
              Upcoming Events
              <ImageIcon className="w-4 h-4" />
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'all' ? (
        <>
          {/* Search */}
          <div className="bg-white rounded-xl shadow p-4 flex items-center gap-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              value={search}
              onChange={(e)=>{ setPage(1); setSearch(e.target.value); }}
              placeholder="Search by title or location..."
              className="flex-1 px-3 py-2 rounded-lg border focus:ring-2 focus:ring-green-500"
            />
          </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((e) => (
                <tr key={e._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{e.title}</div>
                    <div className="text-sm text-gray-500 line-clamp-1">{e.description}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                    <CalIcon className="w-4 h-4 text-gray-400" /> {new Date(e.dateTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" /> {e.location}
                  </td>
                  <td className="px-6 py-4"><span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">{e.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center gap-3 justify-end">
                      <button className="text-green-600 hover:text-green-800" onClick={()=>openEdit(e)} title="Edit"><Edit className="w-4 h-4"/></button>
                      <button className="text-red-600 hover:text-red-800" onClick={()=>handleDelete(e._id)} title="Delete"><Trash2 className="w-4 h-4"/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td className="px-6 py-10 text-center text-gray-500" colSpan={5}>No events found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t bg-gray-50">
          <div className="text-sm text-gray-600">Page {page} of {totalPages}</div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Prev</button>
            <button className="px-3 py-1 border rounded disabled:opacity-50" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Next</button>
          </div>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">{editing?._id ? 'Edit Event' : 'Add Event'}</h3>
                <button onClick={()=>setShowModal(false)} className="text-gray-500">✕</button>
              </div>
              <EventForm initialValues={editing} onSubmit={handleSave} onCancel={()=>setShowModal(false)} submitting={submitting} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
        </>
      ) : (
        <UpcomingEventsManager />
      )}
    </div>
  );
}