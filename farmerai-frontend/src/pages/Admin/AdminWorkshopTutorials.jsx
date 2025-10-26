import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Star, Play, ArrowUp, ArrowDown } from 'lucide-react';
import apiClient from '../../services/apiClient';
import WorkshopTutorialForm from '../../components/admin/WorkshopTutorialForm';

export default function AdminWorkshopTutorials() {
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, featured

  const fetchTutorials = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit, 
        q: search,
        isActive: filter === 'active' ? 'true' : filter === 'inactive' ? 'false' : undefined,
        isFeatured: filter === 'featured' ? 'true' : undefined
      };
      const { data } = await apiClient.get('/workshop-tutorials', { params });
      setTutorials(Array.isArray(data) ? data : (data?.data || []));
      const pagination = data?.pagination;
      setTotal(pagination?.total || data?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load workshop tutorials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTutorials();
  }, [page, search, filter]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (tutorial) => {
    setEditing(tutorial);
    setShowModal(true);
  };

  const handleSave = async (values) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(values).forEach(key => {
        if (key === 'image' && values[key]) {
          formData.append('image', values[key]);
        } else if (key !== 'image') {
          formData.append(key, values[key]);
        }
      });

      if (editing?._id) {
        await apiClient.put(`/workshop-tutorials/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Workshop tutorial updated');
      } else {
        await apiClient.post('/workshop-tutorials', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Workshop tutorial created');
      }
      setShowModal(false);
      fetchTutorials();
    } catch (e) {
      toast.error('Failed to save workshop tutorial');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this workshop tutorial?')) return;
    try {
      await apiClient.delete(`/workshop-tutorials/${id}`);
      toast.success('Workshop tutorial deleted');
      fetchTutorials();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (tutorial) => {
    try {
      await apiClient.put(`/workshop-tutorials/${tutorial._id}`, { isActive: !tutorial.isActive });
      toast.success(`Tutorial ${tutorial.isActive ? 'deactivated' : 'activated'}`);
      fetchTutorials();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const toggleFeatured = async (tutorial) => {
    try {
      await apiClient.put(`/workshop-tutorials/${tutorial._id}`, { isFeatured: !tutorial.isFeatured });
      toast.success(`Tutorial ${tutorial.isFeatured ? 'unfeatured' : 'featured'}`);
      fetchTutorials();
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  const moveItem = async (tutorial, direction) => {
    try {
      const newOrder = direction === 'up' ? tutorial.displayOrder - 1 : tutorial.displayOrder + 1;
      await apiClient.put(`/workshop-tutorials/${tutorial._id}`, { displayOrder: newOrder });
      toast.success('Order updated');
      fetchTutorials();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const getYouTubeVideoId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workshop Tutorials</h1>
          <p className="text-gray-600">Manage workshop tutorials and YouTube videos</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Tutorial
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilter('featured')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'featured' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Featured
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tutorials..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Tutorial Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {tutorials.map((tutorial) => {
              const videoId = getYouTubeVideoId(tutorial.videoLink);
              const thumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : null;
              
              return (
                <motion.div
                  key={tutorial._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white rounded-lg shadow-md overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={tutorial.image?.url}
                      alt={tutorial.image?.alt || tutorial.title}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => toggleActive(tutorial)}
                        className={`p-1 rounded-full ${
                          tutorial.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                        }`}
                      >
                        {tutorial.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                      <button
                        onClick={() => toggleFeatured(tutorial)}
                        className={`p-1 rounded-full ${
                          tutorial.isFeatured ? 'bg-yellow-500 text-white' : 'bg-gray-500 text-white'
                        }`}
                      >
                        <Star className="w-3 h-3" />
                      </button>
                    </div>
                    {thumbnail && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 hover:opacity-100 transition-opacity">
                        <Play className="w-12 h-12 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate">{tutorial.title}</h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{tutorial.description}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex gap-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {tutorial.category}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                          {tutorial.difficulty}
                        </span>
                        {tutorial.duration && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                            {tutorial.duration}m
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => moveItem(tutorial, 'up')}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveItem(tutorial, 'down')}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEdit(tutorial)}
                          className="p-1 text-blue-500 hover:text-blue-700"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleDelete(tutorial._id)}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                      <span>{tutorial.viewCount} views</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span>{tutorial.rating?.average || 0}</span>
                        <span>({tutorial.rating?.count || 0})</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <WorkshopTutorialForm
            editing={editing}
            onSave={handleSave}
            onClose={() => setShowModal(false)}
            submitting={submitting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

