import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Calendar as CalIcon, 
  MapPin, 
  Clock, 
  Edit, 
  Trash2, 
  Download, 
  Image as ImageIcon,
  Users,
  Eye,
  EyeOff,
  Star,
  Filter,
  X
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import EventForm from './EventForm';
import * as XLSX from 'xlsx';

export default function UpcomingEventsManager() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, upcoming, featured
  const [sortBy, setSortBy] = useState('dateTime'); // dateTime, title, createdAt

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit, 
        q: search,
        filter: 'upcoming', // Only fetch upcoming events
        sortBy,
        sortOrder: 'asc'
      };
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

  useEffect(() => { 
    fetchEvents(); 
  }, [page, search, sortBy]);

  const openCreate = () => { 
    setEditing(null); 
    setShowModal(true); 
  };

  const openEdit = (ev) => { 
    setEditing({ _id: ev._id, ...formatToForm(ev) }); 
    setShowModal(true); 
  };

  const formatToForm = (ev) => ({
    title: ev.title,
    description: ev.description,
    location: ev.location,
    date: ev.dateTime ? new Date(ev.dateTime).toISOString().slice(0,10) : '',
    time: ev.dateTime ? new Date(ev.dateTime).toISOString().slice(11,16) : '',
    category: ev.category || 'training',
    maxAttendees: ev.maxAttendees || '',
    imageUrl: ev.images?.[0]?.url || ev.imageUrl || '',
    registrationLink: ev.registrationLink || ''
  });

  const handleSave = async (values) => {
    try {
      setSubmitting(true);
      const eventData = {
        ...values,
        dateTime: new Date(`${values.date}T${values.time}`).toISOString(),
        status: 'published',
        featured: false,
        images: values.imageUrl ? [{ url: values.imageUrl, alt: values.title }] : []
      };

      if (editing?._id) {
        await apiClient.put(`/admin/events/${editing._id}`, eventData);
        toast.success('Event updated successfully');
      } else {
        await apiClient.post('/admin/events', eventData);
        toast.success('Event created successfully');
      }
      setShowModal(false);
      fetchEvents();
    } catch (e) {
      console.error('Save error:', e);
      toast.error('Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    try {
      await apiClient.delete(`/admin/events/${id}`);
      toast.success('Event deleted successfully');
      fetchEvents();
    } catch (e) {
      console.error('Delete error:', e);
      toast.error('Failed to delete event');
    }
  };

  const toggleFeatured = async (id, currentFeatured) => {
    try {
      await apiClient.patch(`/admin/events/${id}`, { featured: !currentFeatured });
      toast.success(`Event ${!currentFeatured ? 'featured' : 'unfeatured'} successfully`);
      fetchEvents();
    } catch (e) {
      console.error('Toggle featured error:', e);
      toast.error('Failed to update event');
    }
  };

  const exportCSV = () => {
    const rows = events.map(e => ({
      title: e.title,
      description: e.description,
      category: e.category,
      dateTime: new Date(e.dateTime).toLocaleString(),
      location: e.location,
      maxAttendees: e.maxAttendees || '',
      registrationLink: e.registrationLink || '',
      imageUrl: e.images?.[0]?.url || e.imageUrl || '',
      featured: e.featured ? 'Yes' : 'No',
      status: e.status
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Upcoming Events');
    XLSX.writeFile(wb, 'upcoming-events.csv');
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'featured') return event.featured;
    if (filter === 'upcoming') return new Date(event.dateTime) > new Date();
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Upcoming Events</h2>
          <p className="text-gray-600">Manage and register upcoming events with photos</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            <Plus className="w-4 h-4" /> Add Event
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <select
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Events</option>
            <option value="upcoming">Upcoming</option>
            <option value="featured">Featured</option>
          </select>
          <select
            className="border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="dateTime">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="createdAt">Sort by Created</option>
          </select>
        </div>
      </div>

      {/* Events Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg border p-4 animate-pulse">
              <div className="h-48 bg-gray-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <CalIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <div className="text-gray-700 font-medium">No upcoming events found</div>
          <div className="text-sm text-gray-500">Create your first event to get started</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <motion.div
              key={event._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Event Image */}
              <div className="relative h-48 bg-gray-100">
                {event.images?.[0]?.url || event.imageUrl ? (
                  <img
                    src={event.images?.[0]?.url || event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-1">
                  <button
                    onClick={() => toggleFeatured(event._id, event.featured)}
                    className={`p-1 rounded-full ${
                      event.featured 
                        ? 'bg-yellow-500 text-white' 
                        : 'bg-white text-gray-600 hover:bg-yellow-50'
                    }`}
                    title={event.featured ? 'Remove from featured' : 'Add to featured'}
                  >
                    <Star className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Event Details */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 line-clamp-2">{event.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    event.category === 'training' ? 'bg-blue-100 text-blue-800' :
                    event.category === 'market' ? 'bg-green-100 text-green-800' :
                    event.category === 'community' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {event.category}
                  </span>
                </div>

                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{event.description}</p>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <CalIcon className="w-4 h-4 mr-2" />
                    {new Date(event.dateTime).toLocaleDateString()}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(event.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-2" />
                    <span className="truncate">{event.location}</span>
                  </div>
                  {event.maxAttendees && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Max {event.maxAttendees} attendees
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => openEdit(event)}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <Edit className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event._id)}
                    className="px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <div className="flex gap-1">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`px-3 py-2 text-sm rounded-lg ${
                  page === i + 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border hover:bg-gray-50'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Event Form Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">
                    {editing ? 'Edit Event' : 'Create New Event'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
                <EventForm
                  initialValues={editing}
                  onSubmit={handleSave}
                  onCancel={() => setShowModal(false)}
                  submitting={submitting}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
