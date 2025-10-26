import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Plus, Search, Edit, Trash2, Eye, EyeOff, Calendar, User } from 'lucide-react';
import apiClient from '../../services/apiClient';
import BlogForm from '../../components/admin/BlogForm';

export default function AdminBlogs() {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState('all'); // all, published, draft

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const params = { 
        page, 
        limit, 
        q: search,
        isPublished: filter === 'published' ? 'true' : filter === 'draft' ? 'false' : undefined
      };
      const { data } = await apiClient.get('/blogs', { params });
      setBlogs(Array.isArray(data) ? data : (data?.data || []));
      const pagination = data?.pagination;
      setTotal(pagination?.total || data?.total || 0);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, [page, search, filter]);

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  const openEdit = (blog) => {
    setEditing(blog);
    setShowModal(true);
  };

  const handleSave = async (values) => {
    try {
      setSubmitting(true);
      const formData = new FormData();
      
      // Add all form fields
      Object.keys(values).forEach(key => {
        if (key === 'coverImage' && values[key]) {
          formData.append('coverImage', values[key]);
        } else if (key !== 'coverImage') {
          formData.append(key, values[key]);
        }
      });

      if (editing?._id) {
        await apiClient.put(`/blogs/${editing._id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Blog updated');
      } else {
        await apiClient.post('/blogs', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success('Blog created');
      }
      setShowModal(false);
      fetchBlogs();
    } catch (e) {
      toast.error('Failed to save blog');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this blog post?')) return;
    try {
      await apiClient.delete(`/blogs/${id}`);
      toast.success('Blog deleted');
      fetchBlogs();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const togglePublished = async (blog) => {
    try {
      await apiClient.put(`/blogs/${blog._id}`, { 
        isPublished: !blog.isPublished,
        publishedAt: !blog.isPublished ? new Date().toISOString() : null
      });
      toast.success(`Blog ${blog.isPublished ? 'unpublished' : 'published'}`);
      fetchBlogs();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Blog Management</h1>
          <p className="text-gray-600">Manage blog posts and content</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Blog Post
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
            onClick={() => setFilter('published')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'published' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-3 py-1 rounded-lg text-sm ${
              filter === 'draft' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Drafts
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search blog posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Blog List */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {blogs.map((blog) => (
              <motion.div
                key={blog._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-lg shadow-md p-6"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={blog.coverImage?.url}
                      alt={blog.coverImage?.alt || blog.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {blog.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {blog.excerpt || blog.content?.substring(0, 150) + '...'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {blog.author?.name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {blog.publishedAt 
                              ? new Date(blog.publishedAt).toLocaleDateString()
                              : 'Not published'
                            }
                          </div>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                            {blog.category}
                          </span>
                          {blog.featured && (
                            <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                              Featured
                            </span>
                          )}
                          <span className="text-gray-400">
                            {blog.viewCount} views
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => togglePublished(blog)}
                          className={`p-2 rounded-lg ${
                            blog.isPublished 
                              ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                          title={blog.isPublished ? 'Unpublish' : 'Publish'}
                        >
                          {blog.isPublished ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => openEdit(blog)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(blog._id)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
          <BlogForm
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

