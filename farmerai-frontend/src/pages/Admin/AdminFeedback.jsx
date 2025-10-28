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
  Save,
  BarChart3,
  TrendingUp,
  Star,
  Users,
  Settings,
  Bell,
  Mail,
  Phone,
  MapPin,
  Award,
  Target,
  Zap,
  Shield,
  Activity,
  PieChart,
  LineChart
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
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    priority: 'all',
    search: '',
    dateRange: 'all',
    assignedTo: 'all'
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
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
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
      loadAnalytics();
      loadNotifications();
    }
  }, [user, filters]);

  // Handle tab changes
  useEffect(() => {
    if (user && user.role === 'admin') {
      let newFilters = { ...filters };
      
      if (activeTab === 'pending') {
        newFilters.status = 'Received';
      } else if (activeTab === 'in-progress') {
        newFilters.status = 'In Progress';
      } else if (activeTab === 'completed') {
        newFilters.status = 'Completed';
      } else if (activeTab === 'overview') {
        newFilters.status = 'all';
      }
      
      if (newFilters.status !== filters.status) {
        setFilters(newFilters);
      }
    }
  }, [activeTab, user]);

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.get('/feedback/admin/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get('/feedback/admin/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

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
      
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Management</h1>
              <p className="text-gray-600 mt-1">Manage and respond to user feedback with advanced analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* Analytics Toggle */}
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`p-3 rounded-xl transition-colors ${
                showAnalytics 
                  ? 'bg-green-100 text-green-600' 
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <BarChart3 className="w-6 h-6" />
            </button>
            
            {/* Settings */}
            <button className="p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Activity, count: counts.total },
              { id: 'pending', label: 'Pending', icon: Clock, count: counts.received },
              { id: 'in-progress', label: 'In Progress', icon: AlertCircle, count: counts.inProgress },
              { id: 'completed', label: 'Completed', icon: CheckCircle, count: counts.completed },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'reports', label: 'Reports', icon: FileText }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

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

      {/* Content based on active tab */}
      <Section className="space-y-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl border-2 border-blue-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-500 rounded-xl">
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-blue-600">
                    {counts.received}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-blue-800 mb-1">Urgent Actions</h3>
                <p className="text-sm text-blue-600">New feedback requiring immediate attention</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl border-2 border-yellow-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-yellow-500 rounded-xl">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-yellow-600">
                    {counts.inProgress}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-1">In Progress</h3>
                <p className="text-sm text-yellow-600">Feedback currently being worked on</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl border-2 border-green-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-500 rounded-xl">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-green-600">
                    {counts.completed}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-green-800 mb-1">Completed</h3>
                <p className="text-sm text-green-600">Successfully resolved feedback</p>
              </motion.div>
            </div>

            {/* Recent Feedback */}
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Recent Feedback</h3>
              <div className="space-y-4">
                {feedback.slice(0, 5).map((item) => {
                  const TypeIcon = getTypeIcon(item.type);
                  const StatusIcon = getStatusIcon(item.status);
                  
                  return (
                    <div key={item._id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
                      <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                        <TypeIcon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{item.subject}</h4>
                        <p className="text-sm text-gray-600">{item.userId?.name || item.userId?.email || 'Anonymous User'} • {formatDate(item.createdAt)}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                        {item.status}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-6">
            {/* Analytics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border-2 border-purple-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-500 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-purple-600">
                    {analytics.avgResponseTime || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-purple-800 mb-1">Avg Response Time</h3>
                <p className="text-sm text-purple-600">Days to respond</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl border-2 border-indigo-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-indigo-500 rounded-xl">
                    <Star className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-indigo-600">
                    {analytics.satisfactionRate || 0}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-indigo-800 mb-1">Satisfaction Rate</h3>
                <p className="text-sm text-indigo-600">User satisfaction</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl border-2 border-pink-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-pink-500 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-pink-600">
                    {analytics.activeUsers || 0}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-pink-800 mb-1">Active Users</h3>
                <p className="text-sm text-pink-600">Users with feedback</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-2xl border-2 border-teal-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-teal-500 rounded-xl">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-2xl font-bold text-teal-600">
                    {analytics.resolutionRate || 0}%
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-teal-800 mb-1">Resolution Rate</h3>
                <p className="text-sm text-teal-600">Issues resolved</p>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Status Distribution</h3>
                <div className="space-y-4">
                  {analytics.statusDistribution?.map((item, index) => (
                    <div key={item.status} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getStatusColor(item.status)}`}>
                          {item.status === 'Received' && <Clock className="w-4 h-4" />}
                          {item.status === 'In Progress' && <AlertCircle className="w-4 h-4" />}
                          {item.status === 'Completed' && <CheckCircle className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-gray-700">{item.status}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.status === 'Received' ? 'bg-yellow-500' :
                              item.status === 'In Progress' ? 'bg-blue-500' :
                              'bg-green-500'
                            }`}
                            style={{ width: `${(item.count / analytics.totalFeedback) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-gray-100 p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Type Distribution</h3>
                <div className="space-y-4">
                  {analytics.typeDistribution?.map((item, index) => (
                    <div key={item.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-lg ${getTypeColor(item.type)}`}>
                          {item.type === 'Bug Report' && <Bug className="w-4 h-4" />}
                          {item.type === 'Feature Suggestion' && <Lightbulb className="w-4 h-4" />}
                          {item.type === 'General Comment' && <MessageSquare className="w-4 h-4" />}
                        </div>
                        <span className="font-medium text-gray-700">{item.type}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              item.type === 'Bug Report' ? 'bg-red-500' :
                              item.type === 'Feature Suggestion' ? 'bg-yellow-500' :
                              'bg-blue-500'
                            }`}
                            style={{ width: `${(item.count / analytics.totalFeedback) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-semibold text-gray-600 w-8 text-right">
                          {item.count}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Default feedback list for other tabs */}
        {(activeTab === 'pending' || activeTab === 'in-progress' || activeTab === 'completed') && (
          <div className="space-y-6">
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
                              <span>{item.userId?.name || item.userId?.email || 'Anonymous User'}</span>
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



