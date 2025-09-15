import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Bug, 
  Lightbulb, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  User,
  Calendar,
  FileText,
  Download,
  ExternalLink,
  X,
  Save
} from 'lucide-react';
import PageHeader from '../../components/PageHeader';
import Section from '../../components/Section';
import Toast from '../../components/Toast';
import HomeButton from '../../components/HomeButton';
import useAuth from '../../hooks/useAuth';
import apiClient from '../../services/apiClient';

export default function AdminFeedback() {
  const { user } = useAuth();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: ''
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });
  const [counts, setCounts] = useState({
    received: 0,
    inProgress: 0,
    completed: 0,
    total: 0
  });
  const [editData, setEditData] = useState({
    status: '',
    adminNotes: '',
    farmerComment: '',
    adminComment: '',
    priority: '',
    assignedTo: ''
  });

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setToast({ type: 'error', message: 'Access denied. Admin privileges required.' });
    }
  }, [user]);

  // Load feedback data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadFeedback();
    }
  }, [user, filters]);

  const loadFeedback = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.priority !== 'all') params.append('priority', filters.priority);
      if (filters.search) params.append('search', filters.search);
      params.append('page', page);
      params.append('limit', '10');

      const response = await apiClient.get(`/feedback/admin/all?${params}`);
      setFeedback(response.data.feedback);
      setPagination(response.data.pagination);
      setCounts(response.data.counts);
    } catch (error) {
      console.error('Error loading feedback:', error);
      setToast({ type: 'error', message: 'Failed to load feedback' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFeedback) return;

    setProcessingId(selectedFeedback._id);
    try {
      await apiClient.put(`/feedback/admin/${selectedFeedback._id}`, editData);
      setToast({ type: 'success', message: 'Feedback updated successfully' });
      setShowEditModal(false);
      loadFeedback(pagination.current);
    } catch (error) {
      console.error('Error updating feedback:', error);
      setToast({ type: 'error', message: 'Failed to update feedback' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async () => {
    if (!selectedFeedback) return;

    setProcessingId(selectedFeedback._id);
    try {
      await apiClient.delete(`/feedback/admin/${selectedFeedback._id}`);
      setToast({ type: 'success', message: 'Feedback deleted successfully' });
      setShowDeleteModal(false);
      loadFeedback(pagination.current);
    } catch (error) {
      console.error('Error deleting feedback:', error);
      setToast({ type: 'error', message: 'Failed to delete feedback' });
    } finally {
      setProcessingId(null);
    }
  };

  const openDetails = (item) => {
    setSelectedFeedback(item);
    setShowDetails(true);
  };

  const openEditModal = (item) => {
    setSelectedFeedback(item);
    setEditData({
      status: item.status,
      adminNotes: item.adminNotes || '',
      farmerComment: item.farmerComment || '',
      adminComment: item.adminComment || '',
      priority: item.priority,
      assignedTo: item.assignedTo?._id || ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (item) => {
    setSelectedFeedback(item);
    setShowDeleteModal(true);
  };

  const getTypeIcon = (type) => {
    const icons = {
      'Bug Report': Bug,
      'Feature Suggestion': Lightbulb,
      'General Comment': MessageSquare
    };
    return icons[type] || MessageSquare;
  };

  const getTypeColor = (type) => {
    const colors = {
      'Bug Report': 'text-red-600 bg-red-100',
      'Feature Suggestion': 'text-yellow-600 bg-yellow-100',
      'General Comment': 'text-blue-600 bg-blue-100'
    };
    return colors[type] || 'text-gray-600 bg-gray-100';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'Received': Clock,
      'In Progress': AlertCircle,
      'Completed': CheckCircle
    };
    return icons[status] || Clock;
  };

  const getStatusColor = (status) => {
    const colors = {
      'Received': 'text-yellow-600 bg-yellow-100',
      'In Progress': 'text-blue-600 bg-blue-100',
      'Completed': 'text-green-600 bg-green-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'text-gray-600 bg-gray-100',
      'Medium': 'text-yellow-600 bg-yellow-100',
      'High': 'text-orange-600 bg-orange-100',
      'Critical': 'text-red-600 bg-red-100'
    };
    return colors[priority] || 'text-gray-600 bg-gray-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto">
        <HomeButton />
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      <PageHeader
        title="Feedback Management"
        subtitle="Manage and respond to user feedback"
        icon="🛠️"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Feedback</p>
              <p className="text-3xl font-bold text-gray-800">{counts.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-yellow-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(255,193,7,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Received</p>
              <p className="text-3xl font-bold text-yellow-600">{counts.received}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-blue-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(59,130,246,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-3xl font-bold text-blue-600">{counts.inProgress}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(34,197,94,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{counts.completed}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)] mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search feedback..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            >
              <option value="all">All Status</option>
              <option value="Received">Received</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            >
              <option value="all">All Types</option>
              <option value="Bug Report">Bug Report</option>
              <option value="Feature Suggestion">Feature Suggestion</option>
              <option value="General Comment">General Comment</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
            >
              <option value="all">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <Section className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">No feedback found</h3>
            <p className="text-gray-500">No feedback matches your current filters</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => {
              const TypeIcon = getTypeIcon(item.type);
              const StatusIcon = getStatusIcon(item.status);
              
              return (
                <motion.div
                  key={item._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                          <TypeIcon className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{item.subject}</h4>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="capitalize">{item.type}</span>
                            <span>•</span>
                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(item.priority)}`}>
                              {item.priority} Priority
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-4 line-clamp-2">{item.description}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <User className="w-4 h-4" />
                          <span>{item.userId.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <StatusIcon className="w-4 h-4" />
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(item.createdAt)}</span>
                        </div>
                        {item.attachment && (
                          <div className="flex items-center space-x-1">
                            <FileText className="w-4 h-4" />
                            <span>Has attachment</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => openDetails(item)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(item)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Edit Modal */}
      {showEditModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-800">Edit Feedback</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={editData.status}
                      onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    >
                      <option value="Received">Received</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                    <select
                      value={editData.priority}
                      onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes (Internal)</label>
                  <textarea
                    value={editData.adminNotes}
                    onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    placeholder="Internal notes for admin team..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Admin Comment (Visible to User)</label>
                  <textarea
                    value={editData.adminComment}
                    onChange={(e) => setEditData(prev => ({ ...prev, adminComment: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-400 focus:border-green-400"
                    placeholder="Response visible to the user..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 pt-6 border-t mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdate}
                  disabled={processingId === selectedFeedback._id}
                  className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60"
                >
                  {processingId === selectedFeedback._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-800">Delete Feedback</h3>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-600 mb-2">
                  Are you sure you want to delete this feedback?
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Subject:</strong> {selectedFeedback.subject}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>Type:</strong> {selectedFeedback.type}
                </p>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={processingId === selectedFeedback._id}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-60"
                >
                  {processingId === selectedFeedback._id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}



