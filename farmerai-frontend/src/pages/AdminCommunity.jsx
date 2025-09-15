import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Edit, 
  Eye, 
  Clock, 
  User, 
  MessageSquare, 
  Calendar, 
  Users,
  AlertTriangle,
  Filter,
  Search,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import Toast from '../components/Toast';
import HomeButton from '../components/HomeButton';
import useAuth from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import PendingFarmers from '../components/admin/PendingFarmers';
import CommunityRequests from '../components/admin/CommunityRequests';

export default function AdminCommunity() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboard, setDashboard] = useState(null);
  const [pendingPosts, setPendingPosts] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [pendingEvents, setPendingEvents] = useState([]);
  const [pendingProfiles, setPendingProfiles] = useState([]);
  const [pendingReports, setPendingReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [editContent, setEditContent] = useState('');

  // Check if user is admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      setToast({ type: 'error', message: 'Access denied. Admin privileges required.' });
    }
  }, [user]);

  // Load dashboard data
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboard();
    }
  }, [user]);

  // Load data based on active tab
  useEffect(() => {
    if (user && user.role === 'admin') {
      loadTabData();
    }
  }, [activeTab, user]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/community/admin/dashboard');
      setDashboard(response.data.dashboard);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setToast({ type: 'error', message: 'Failed to load dashboard' });
    } finally {
      setLoading(false);
    }
  };

  const loadTabData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'posts':
          await loadPendingPosts();
          break;
        case 'comments':
          await loadPendingComments();
          break;
        case 'events':
          await loadPendingEvents();
          break;
        case 'profiles':
          await loadPendingProfiles();
          break;
        case 'reports':
          await loadPendingReports();
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setToast({ type: 'error', message: 'Failed to load data' });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingPosts = async () => {
    const response = await apiClient.get('/community/posts/pending');
    setPendingPosts(response.data.posts || []);
  };

  const loadPendingComments = async () => {
    const response = await apiClient.get('/community/comments/pending');
    setPendingComments(response.data.comments || []);
  };

  const loadPendingEvents = async () => {
    const response = await apiClient.get('/community/events/pending');
    setPendingEvents(response.data.events || []);
  };

  const loadPendingProfiles = async () => {
    const response = await apiClient.get('/community/profiles/pending');
    setPendingProfiles(response.data.profiles || []);
  };

  const loadPendingReports = async () => {
    const response = await apiClient.get('/community/reports');
    setPendingReports(response.data.reports || []);
  };

  const handleApprove = async (type, id) => {
    try {
      await apiClient.put(`/community/admin/${type}s/${id}/approve`);
      setToast({ type: 'success', message: `${type} approved successfully` });
      loadTabData();
      loadDashboard();
    } catch (error) {
      console.error('Error approving:', error);
      setToast({ type: 'error', message: 'Failed to approve' });
    }
  };

  const handleReject = async (type, id) => {
    if (!rejectionReason.trim()) {
      setToast({ type: 'error', message: 'Please provide a rejection reason' });
      return;
    }

    try {
      await apiClient.put(`/community/admin/${type}s/${id}/reject`, {
        rejectionReason
      });
      setToast({ type: 'success', message: `${type} rejected successfully` });
      setShowModal(false);
      setRejectionReason('');
      loadTabData();
      loadDashboard();
    } catch (error) {
      console.error('Error rejecting:', error);
      setToast({ type: 'error', message: 'Failed to reject' });
    }
  };

  const handleEdit = async (type, id) => {
    if (!editContent.trim()) {
      setToast({ type: 'error', message: 'Please provide edited content' });
      return;
    }

    try {
      const payload = type === 'post' ? { content: editContent } : 
                     type === 'comment' ? { content: editContent } :
                     type === 'event' ? { description: editContent } :
                     { bio: editContent };
      
      await apiClient.put(`/community/admin/${type}s/${id}/edit`, payload);
      setToast({ type: 'success', message: `${type} edited and approved successfully` });
      setShowModal(false);
      setEditContent('');
      loadTabData();
      loadDashboard();
    } catch (error) {
      console.error('Error editing:', error);
      setToast({ type: 'error', message: 'Failed to edit' });
    }
  };

  const openModal = (type, item) => {
    setModalType(type);
    setSelectedItem(item);
    setShowModal(true);
    if (type === 'edit') {
      setEditContent(item.content || item.description || item.bio || '');
    }
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

  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {dashboard?.pendingCounts && Object.entries(dashboard.pendingCounts).map(([key, count]) => (
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
              <p className="text-3xl font-bold text-gray-800">{count}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPendingPosts = () => (
    <div className="space-y-6">
      {pendingPosts.map((post) => (
        <motion.div
          key={post._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={post.author.photoURL || '/vite.svg'}
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
              />
              <div>
                <h4 className="font-semibold text-gray-800">{post.author.name}</h4>
                <p className="text-sm text-gray-600">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
              Pending
            </span>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">{post.title}</h3>
          <p className="text-gray-700 mb-4">{post.content}</p>
          
          <div className="flex items-center space-x-2 mb-4">
            <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
              {post.category}
            </span>
            {post.tags && post.tags.map((tag, index) => (
              <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleApprove('post', post._id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => openModal('reject', post)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => openModal('edit', post)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
              <Eye className="w-4 h-4" />
              <span>View</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPendingEvents = () => (
    <div className="space-y-6">
      {pendingEvents.map((event) => (
        <motion.div
          key={event._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{event.title}</h4>
                <p className="text-sm text-gray-600">Suggested by {event.suggestedBy.name}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
              Pending
            </span>
          </div>

          <p className="text-gray-700 mb-4">{event.description}</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatDate(event.schedule.startDate)} at {event.schedule.startTime}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{event.organizer.name}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleApprove('event', event._id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => openModal('reject', event)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => openModal('edit', event)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPendingProfiles = () => (
    <div className="space-y-6">
      {pendingProfiles.map((profile) => (
        <motion.div
          key={profile._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <img
                src={profile.profilePicture || profile.user.photoURL || '/vite.svg'}
                alt={profile.displayName}
                className="w-12 h-12 rounded-full object-cover border-2 border-green-100"
              />
              <div>
                <h4 className="font-semibold text-gray-800">{profile.displayName}</h4>
                <p className="text-sm text-gray-600">{profile.user.name}</p>
              </div>
            </div>
            <span className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded-full">
              Pending
            </span>
          </div>

          {profile.bio && (
            <p className="text-gray-700 mb-4">{profile.bio}</p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{profile.farmingDetails.yearsOfExperience} years experience</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Users className="w-4 h-4" />
              <span>{profile.location.district}, {profile.location.state}</span>
            </div>
          </div>

          {profile.farmingDetails.crops && profile.farmingDetails.crops.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {profile.farmingDetails.crops.map((crop, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  {crop}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-4">
            <button
              onClick={() => handleApprove('profile', profile._id)}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              <CheckCircle className="w-4 h-4" />
              <span>Approve</span>
            </button>
            <button
              onClick={() => openModal('reject', profile)}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject</span>
            </button>
            <button
              onClick={() => openModal('edit', profile)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderPendingReports = () => (
    <div className="space-y-6">
      {pendingReports.map((report) => (
        <motion.div
          key={report._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Report #{report._id.slice(-6)}</h4>
                <p className="text-sm text-gray-600">{formatDate(report.createdAt)}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-xs rounded-full ${
              report.priority === 'urgent' ? 'bg-red-100 text-red-700' :
              report.priority === 'high' ? 'bg-orange-100 text-orange-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {report.priority}
            </span>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Reported Content:</strong> {report.reportedContent.type} - {report.reportedContent.contentId}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <strong>Reason:</strong> {report.reason.replace('-', ' ')}
            </p>
            <p className="text-gray-700">{report.description}</p>
          </div>

          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <CheckCircle className="w-4 h-4" />
              <span>Resolve</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
              <XCircle className="w-4 h-4" />
              <span>Dismiss</span>
            </button>
            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition">
              <Eye className="w-4 h-4" />
              <span>View Content</span>
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

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
        title="Community Admin Panel"
        subtitle="Manage community content, approve submissions, and moderate discussions"
        icon="🛡️"
      />

      {/* Tabs */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex space-x-2">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Users },
              { id: 'community-requests', label: 'Community Requests', icon: UserPlus },
              { id: 'farmers', label: 'Pending Farmers', icon: UserPlus },
              { id: 'posts', label: 'Posts', icon: MessageSquare },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'profiles', label: 'Profiles', icon: User },
              { id: 'reports', label: 'Reports', icon: AlertTriangle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-green-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <Section className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'community-requests' && <CommunityRequests />}
            {activeTab === 'farmers' && <PendingFarmers />}
            {activeTab === 'posts' && renderPendingPosts()}
            {activeTab === 'events' && renderPendingEvents()}
            {activeTab === 'profiles' && renderPendingProfiles()}
            {activeTab === 'reports' && renderPendingReports()}
          </>
        )}
      </Section>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              {modalType === 'reject' ? 'Reject Content' : 'Edit Content'}
            </h3>
            
            {modalType === 'reject' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                  rows="4"
                  placeholder="Please provide a reason for rejection..."
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Edit Content
                </label>
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                  rows="6"
                  placeholder="Edit the content..."
                />
              </div>
            )}
            
            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={() => {
                  if (modalType === 'reject') {
                    handleReject(selectedItem.reportedContent?.type || 'post', selectedItem._id);
                  } else {
                    handleEdit(selectedItem.reportedContent?.type || 'post', selectedItem._id);
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-lg text-white transition ${
                  modalType === 'reject' 
                    ? 'bg-red-600 hover:bg-red-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {modalType === 'reject' ? 'Reject' : 'Save & Approve'}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setRejectionReason('');
                  setEditContent('');
                }}
                className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
    </div>
  );
}
