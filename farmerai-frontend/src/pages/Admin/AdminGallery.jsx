import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from 'lucide-react';
import apiClient from '../../services/apiClient';
import GalleryForm from '../../components/admin/GalleryForm';

export default function AdminGallery() {
  const [galleryItems, setGalleryItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchGalleryItems = async () => {
    try {
      setLoading(true);
      const params = { page, limit, q: search };
      const { data } = await apiClient.get('/gallery', { params });
      setGalleryItems(Array.isArray(data) ? data : (data?.data || []));
      const pagination = data?.pagination;
      setTotal(pagination?.total || data?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load gallery items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGalleryItems();
  }, [page, search]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (item) => {
    setEditing(item);
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
        await apiClient.put(`/gallery/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Gallery item updated');
      } else {
        await apiClient.post('/gallery', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Gallery item created');
      }
      setShowModal(false);
      fetchGalleryItems();
    } catch (e) {
      toast.error('Failed to save gallery item');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this gallery item?')) return;
    try {
      await apiClient.delete(`/gallery/${id}`);
      toast.success('Gallery item deleted');
      fetchGalleryItems();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const toggleActive = async (item) => {
    try {
      await apiClient.put(`/gallery/${item._id}`, { isActive: !item.isActive });
      toast.success(`Gallery item ${item.isActive ? 'deactivated' : 'activated'}`);
      fetchGalleryItems();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const moveItem = async (item, direction) => {
    try {
      const newOrder = direction === 'up' ? item.displayOrder - 1 : item.displayOrder + 1;
      await apiClient.put(`/gallery/${item._id}`, { displayOrder: newOrder });
      toast.success('Order updated');
      fetchGalleryItems();
    } catch {
      toast.error('Failed to update order');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600">Manage gallery images and content</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Gallery Item
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search gallery items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {galleryItems.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-md overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={item.image?.url}
                    alt={item.image?.alt || item.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      onClick={() => toggleActive(item)}
                      className={`p-1 rounded-full ${
                        item.isActive ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
                      }`}
                    >
                      {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate">{item.title}</h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {item.category}
                    </span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveItem(item, 'up')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => moveItem(item, 'down')}
                        className="p-1 text-gray-500 hover:text-gray-700"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => openEdit(item)}
                        className="p-1 text-blue-500 hover:text-blue-700"
                      >
                        <Edit className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(item._id)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
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
          <GalleryForm
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

