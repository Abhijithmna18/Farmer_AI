import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Calendar, 
  Users, 
  Search, 
  Plus, 
  Filter,
  TrendingUp,
  Clock,
  MapPin,
  User,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Eye,
  Tag,
  MoreVertical,
  UserPlus,
  CheckCircle,
  AlertCircle,
  Lock
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import Toast from '../components/Toast';
import HomeButton from '../components/HomeButton';
import JoinCommunityForm from '../components/JoinCommunityForm';
import useAuth from '../hooks/useAuth';
import apiClient from '../services/apiClient';

const CATEGORIES = [
  'Crop-Specific Questions',
  'Pest & Disease Control',
  'Irrigation Techniques',
  'Soil Health',
  'FarmerAI Support',
  'Government Schemes & Subsidies'
];

const EVENT_TYPES = [
  'workshop',
  'festival',
  'seminar',
  'field-visit',
  'training',
  'other'
];

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [posts, setPosts] = useState([]);
  const [events, setEvents] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEventType, setSelectedEventType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('post');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [userApprovalStatus, setUserApprovalStatus] = useState(null);

  // Load data based on active tab
  useEffect(() => {
    loadData();
  }, [activeTab, selectedCategory, selectedEventType]);

  // Check user approval status
  useEffect(() => {
    if (user) {
      checkUserApprovalStatus();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'discussions':
          await loadPosts();
          break;
        case 'events':
          await loadEvents();
          break;
        case 'profiles':
          await loadProfiles();
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

  const loadPosts = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      params.append('page', '1');
      params.append('limit', '20');
      
      const response = await apiClient.get(`/community/posts?${params}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading posts:', error);
      throw error;
    }
  };

  const loadEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedEventType) params.append('eventType', selectedEventType);
      params.append('page', '1');
      params.append('limit', '20');
      
      const response = await apiClient.get(`/community/events?${params}`);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error loading events:', error);
      throw error;
    }
  };

  const loadProfiles = async () => {
    try {
      const response = await apiClient.get('/community/profiles?page=1&limit=20');
      setProfiles(response.data.profiles || []);
    } catch (error) {
      console.error('Error loading profiles:', error);
      throw error;
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/community/search?q=${encodeURIComponent(searchQuery)}`);
      // Handle search results based on active tab
      if (activeTab === 'discussions') {
        setPosts(response.data.results.filter(item => item.type === 'post'));
      } else if (activeTab === 'events') {
        setEvents(response.data.results.filter(item => item.type === 'event'));
      } else if (activeTab === 'profiles') {
        setProfiles(response.data.results.filter(item => item.type === 'profile'));
      }
    } catch (error) {
      console.error('Error searching:', error);
      setToast({ type: 'error', message: 'Search failed' });
    } finally {
      setLoading(false);
    }
  };

  const checkUserApprovalStatus = async () => {
    try {
      const response = await apiClient.get('/community/user-approval-status');
      setUserApprovalStatus(response.data.status);
    } catch (error) {
      console.error('Error checking approval status:', error);
      // If user is not authenticated or no status found, set to null
      setUserApprovalStatus(null);
    }
  };

  const handleVote = async (type, id, voteType) => {
    if (userApprovalStatus !== 'approved') {
      setToast({ type: 'error', message: 'You must wait for admin approval to participate in the community.' });
      return;
    }

    try {
      const endpoint = `/community/${type}s/${id}/${voteType}`;
      await apiClient.post(endpoint);
      
      // Reload data to get updated vote counts
      loadData();
      
      setToast({ type: 'success', message: `${voteType} recorded successfully` });
    } catch (error) {
      console.error('Error voting:', error);
      setToast({ type: 'error', message: 'Failed to record vote' });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderPosts = () => (
    <div className="space-y-6">
      {posts.map((post) => (
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
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                {post.category}
              </span>
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <MoreVertical className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <h3 className="text-xl font-semibold text-gray-800 mb-3">{post.title}</h3>
          <p className="text-gray-700 mb-4 line-clamp-3">{post.content}</p>

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVote('post', post._id, 'upvote')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>{post.voteCount || 0}</span>
                </button>
                <button
                  onClick={() => handleVote('post', post._id, 'downvote')}
                  className="flex items-center space-x-1 px-3 py-1 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <MessageCircle className="w-4 h-4" />
                <span>{post.commentCount || 0}</span>
              </div>
              <div className="flex items-center space-x-1 text-sm text-gray-600">
                <Eye className="w-4 h-4" />
                <span>{post.views || 0}</span>
              </div>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              View Discussion
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-6">
      {events.map((event) => (
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
            <span className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full capitalize">
              {event.eventType}
            </span>
          </div>

          <p className="text-gray-700 mb-4">{event.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{formatDate(event.schedule.startDate)} at {event.schedule.startTime}</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{event.location.district}, {event.location.state}</span>
            </div>
          </div>

          {event.tags && event.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {event.tags.map((tag, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  <Tag className="w-3 h-3 inline mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>{event.registrationCount || 0} registered</span>
              <span>{event.capacity?.maxAttendees ? `${event.capacity.maxAttendees} max` : 'Unlimited'}</span>
              <span className={event.cost?.isFree ? 'text-green-600' : 'text-orange-600'}>
                {event.cost?.isFree ? 'Free' : `₹${event.cost?.amount}`}
              </span>
            </div>
            <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Register
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );

  const renderProfiles = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {profiles.map((profile) => (
        <motion.div
          key={profile._id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]"
        >
          <div className="flex items-center space-x-3 mb-4">
            <img
              src={profile.profilePicture || profile.user.photoURL || '/vite.svg'}
              alt={profile.displayName}
              className="w-16 h-16 rounded-full object-cover border-2 border-green-100"
            />
            <div>
              <h4 className="font-semibold text-gray-800">{profile.displayName}</h4>
              <p className="text-sm text-gray-600">{profile.location.district}, {profile.location.state}</p>
        </div>
          </div>

          {profile.bio && (
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{profile.bio}</p>
          )}

          <div className="space-y-2 mb-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <User className="w-4 h-4" />
              <span>{profile.farmingDetails.yearsOfExperience} years experience</span>
            </div>
            {profile.farmingDetails.farmSize && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4" />
                <span>{profile.farmingDetails.farmSize} acres</span>
              </div>
            )}
          </div>

          {profile.farmingDetails.crops && profile.farmingDetails.crops.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {profile.farmingDetails.crops.slice(0, 3).map((crop, index) => (
                <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                  {crop}
                </span>
              ))}
              {profile.farmingDetails.crops.length > 3 && (
                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{profile.farmingDetails.crops.length - 3} more
                </span>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <TrendingUp className="w-4 h-4" />
              <span>{profile.stats.reputation || 0} reputation</span>
            </div>
            <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              View Profile
            </button>
          </div>
        </motion.div>
      ))}
      </div>
    );

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      <PageHeader
        title="FarmerAI Community"
        subtitle="Connect with fellow farmers, share knowledge, and grow together"
        icon="🌾"
      />

      {/* Search Bar */}
        <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search discussions, events, and profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
              >
                Search
              </button>
              {!user && (
                <button
                  onClick={() => setShowJoinForm(true)}
                  className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
                >
                  <UserPlus className="w-5 h-5" />
                  <span>Join Community</span>
                </button>
              )}
            </div>
          </div>
          
          {/* Approval Status Banner */}
          {user && userApprovalStatus && (
            <div className="mt-4 p-4 rounded-xl border-2">
              {userApprovalStatus === 'pending' && (
                <div className="flex items-center space-x-3 bg-yellow-50 border-yellow-200 text-yellow-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Your community request is pending approval</p>
                    <p className="text-sm">You'll receive an email confirmation once approved by our admin team.</p>
                  </div>
                </div>
              )}
              {userApprovalStatus === 'rejected' && (
                <div className="flex items-center space-x-3 bg-red-50 border-red-200 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Your request was not approved</p>
                    <p className="text-sm">Please contact admin for more details or submit a new request.</p>
                  </div>
                </div>
              )}
              {userApprovalStatus === 'approved' && (
                <div className="flex items-center space-x-3 bg-green-50 border-green-200 text-green-800">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Welcome to the FarmerAI Community!</p>
                    <p className="text-sm">Your account is now active. You can participate in discussions, events, and more.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex space-x-2">
            {[
              { id: 'discussions', label: 'Discussions', icon: MessageSquare },
              { id: 'events', label: 'Events', icon: Calendar },
              { id: 'profiles', label: 'Profiles', icon: Users }
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

      {/* Filters */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex flex-wrap gap-4">
            {activeTab === 'discussions' && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                >
                  <option value="">All Categories</option>
                  {CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
            )}
            {activeTab === 'events' && (
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={selectedEventType}
                  onChange={(e) => setSelectedEventType(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                >
                  <option value="">All Event Types</option>
                  {EVENT_TYPES.map((type) => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Button */}
      {user && (
        <div className="mb-8">
          {userApprovalStatus === 'approved' ? (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Create New {activeTab === 'discussions' ? 'Post' : activeTab === 'events' ? 'Event' : 'Profile'}</span>
            </button>
          ) : (
            <div className="relative">
              <button
                disabled
                className="flex items-center space-x-2 px-6 py-3 bg-gray-400 text-white rounded-xl cursor-not-allowed shadow-lg"
                title="You must wait for admin approval to participate"
              >
                <Lock className="w-5 h-5" />
                <span>Create New {activeTab === 'discussions' ? 'Post' : activeTab === 'events' ? 'Event' : 'Profile'}</span>
              </button>
              <div className="absolute top-full left-0 mt-2 px-3 py-2 bg-gray-800 text-white text-sm rounded-lg opacity-0 hover:opacity-100 transition-opacity whitespace-nowrap">
                You must wait for admin approval to participate
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <Section className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <>
            {activeTab === 'discussions' && renderPosts()}
            {activeTab === 'events' && renderEvents()}
            {activeTab === 'profiles' && renderProfiles()}
          </>
        )}
      </Section>

      <Toast message={toast?.message} type={toast?.type} onDismiss={() => setToast(null)} />
      
      {/* Join Community Form */}
      <JoinCommunityForm
        isOpen={showJoinForm}
        onClose={() => setShowJoinForm(false)}
        onSuccess={() => {
          setToast({ type: 'success', message: 'Join request submitted successfully!' });
        }}
      />
    </div>
  );
}