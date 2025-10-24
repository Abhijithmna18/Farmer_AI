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
  Lock,
  Bell,
  Settings,
  LogOut,
  Bookmark
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import Toast from '../components/Toast';
import HomeButton from '../components/HomeButton';
import JoinCommunityForm from '../components/JoinCommunityForm';
import useAuth from '../hooks/useAuth';
import apiClient from '../services/apiClient';
import PostDetailModal from '../components/community/PostDetailModal';

// Mock data for discussions
const MOCK_POSTS = [
  {
    _id: '1',
    author: {
      name: 'Ramesh Kumar',
      photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80'
    },
    title: 'Problem: Yellow mosaic virus in my soybean crop. Any AI-based solutions?',
    content: 'I\'ve been noticing yellow patches on my soybean leaves and reduced yield this season. Has anyone used AI tools to detect and manage this issue? Looking for recommendations on both detection and treatment approaches.',
    category: 'Pest & Disease Control',
    tags: ['soybean', 'virus', 'AI detection'],
    voteCount: 24,
    commentCount: 5,
    views: 128,
    createdAt: '2025-10-20T10:30:00Z'
  },
  {
    _id: '2',
    author: {
      name: 'Priya S.',
      photoURL: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80'
    },
    title: 'Best practices for using drone data for irrigation?',
    content: 'I recently got a drone with multispectral imaging for my 50-acre farm. What are the best practices for analyzing the data to optimize irrigation? Any software recommendations?',
    category: 'Technology',
    tags: ['drone', 'irrigation', 'multispectral'],
    voteCount: 18,
    commentCount: 7,
    views: 96,
    createdAt: '2025-10-21T14:15:00Z'
  },
  {
    _id: '3',
    author: {
      name: 'Anjali Desai',
      photoURL: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80'
    },
    title: 'Sharing my success with AI-powered crop rotation!',
    content: 'After implementing AI-recommended crop rotation for 2 years, my yields have increased by 25% and soil health has improved significantly. Happy to share my experience and data!',
    category: 'Success Stories',
    tags: ['crop rotation', 'AI', 'yield increase'],
    voteCount: 42,
    commentCount: 12,
    views: 210,
    createdAt: '2025-10-22T09:45:00Z'
  }
];

// Mock data for events
const MOCK_EVENTS = [
  {
    _id: '1',
    title: 'Webinar: Using AI for Precision Fertilization',
    description: 'Learn how to use AI tools to optimize fertilizer application based on soil data and crop needs. Special focus on nitrogen management for wheat crops.',
    eventType: 'webinar',
    suggestedBy: { name: 'Dr. Anand Sharma' },
    location: { district: 'Online', state: 'Zoom' },
    schedule: { 
      startDate: '2025-10-30T16:00:00Z', 
      startTime: '4:00 PM IST' 
    },
    cost: { isFree: true },
    registrationCount: 124,
    capacity: { maxAttendees: 200 },
    tags: ['AI', 'fertilization', 'webinar']
  },
  {
    _id: '2',
    title: 'Local Meetup: Smart Irrigation Workshop (Punjab)',
    description: 'Hands-on workshop on installing and maintaining smart irrigation systems. Bring your questions and farm maps for personalized advice.',
    eventType: 'workshop',
    suggestedBy: { name: 'Karan Singh' },
    location: { district: 'Ludhiana', state: 'Punjab' },
    schedule: { 
      startDate: '2025-11-05T09:00:00Z', 
      startTime: '9:00 AM IST' 
    },
    cost: { isFree: false, amount: 200 },
    registrationCount: 32,
    capacity: { maxAttendees: 50 },
    tags: ['irrigation', 'workshop', 'Punjab']
  },
  {
    _id: '3',
    title: 'Q&A with Agri-Tech Expert Dr. Anand',
    description: 'Live Q&A session with Dr. Anand, leading expert in agricultural AI. Bring your toughest questions about implementing technology on your farm.',
    eventType: 'seminar',
    suggestedBy: { name: 'Community Team' },
    location: { district: 'Online', state: 'YouTube Live' },
    schedule: { 
      startDate: '2025-11-12T18:00:00Z', 
      startTime: '6:00 PM IST' 
    },
    cost: { isFree: true },
    registrationCount: 87,
    capacity: { maxAttendees: null },
    tags: ['Q&A', 'expert', 'AI']
  }
];

// Mock data for profiles
const MOCK_PROFILES = [
  {
    _id: '1',
    displayName: 'Anjali Desai',
    profilePicture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
    location: { district: 'Ahmedabad', state: 'Gujarat' },
    bio: 'Soil Scientist with 15 years of experience in sustainable farming practices. Specialized in organic farming and soil health management.',
    farmingDetails: {
      yearsOfExperience: 15,
      farmSize: 25,
      crops: ['Cotton', 'Wheat', 'Vegetables']
    },
    stats: { reputation: 1240 }
  },
  {
    _id: '2',
    displayName: 'Karan Singh',
    profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
    location: { district: 'Ludhiana', state: 'Punjab' },
    bio: 'Wheat Farmer and Agri-Tech Enthusiast. Passionate about implementing smart farming solutions to increase yield and reduce costs.',
    farmingDetails: {
      yearsOfExperience: 22,
      farmSize: 150,
      crops: ['Wheat', 'Rice', 'Maize']
    },
    stats: { reputation: 890 }
  },
  {
    _id: '3',
    displayName: 'Priya S.',
    profilePicture: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=200&h=200&q=80',
    location: { district: 'Bangalore', state: 'Karnataka' },
    bio: 'Organic Farming Cooperative Leader. Working with 50+ farmers to promote organic practices and direct-to-consumer sales.',
    farmingDetails: {
      yearsOfExperience: 10,
      farmSize: 8,
      crops: ['Vegetables', 'Fruits', 'Herbs']
    },
    stats: { reputation: 1560 }
  }
];

// Mock data for sidebar widgets
const TRENDING_DISCUSSIONS = [
  { id: '1', title: 'Drip Irrigation Cost Analysis', replies: 24 },
  { id: '2', title: 'Best Organic Fertilizers for Rice', replies: 18 },
  { id: '3', title: 'Weather Prediction AI Tools', replies: 32 }
];

const UPCOMING_EVENTS = [
  { id: '1', title: 'Webinar: Soil Health Management', date: 'Oct 30' },
  { id: '2', title: 'Local Meetup: Punjab', date: 'Nov 5' }
];

const FEATURED_MEMBERS = [
  { id: '1', name: 'Dr. Anand Sharma', specialty: 'Agricultural AI Expert' },
  { id: '2', name: 'Meera Patel', specialty: 'Sustainable Farming Specialist' },
  { id: '3', name: 'Rajesh Kumar', specialty: 'Precision Agriculture Consultant' }
];

const QUICK_POLL = {
  question: "What's your biggest challenge this season?",
  options: [
    { id: '1', text: 'Pests', votes: 42 },
    { id: '2', text: 'Water', votes: 38 },
    { id: '3', text: 'Market Price', votes: 56 }
  ]
};

const CATEGORIES = [
  'All',
  'Crop-Specific Questions',
  'Pest & Disease Control',
  'Irrigation Techniques',
  'Soil Health',
  'FarmerAI Support',
  'Government Schemes & Subsidies',
  'Pest Control',
  'AI Tools',
  'Market Prices'
];

const EVENT_TYPES = [
  'All',
  'workshop',
  'festival',
  'seminar',
  'field-visit',
  'training',
  'other',
  'Webinars',
  'Local Meetups',
  'Workshops',
  'Past Events'
];

export default function Community() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('discussions');
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [profiles, setProfiles] = useState(MOCK_PROFILES);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedEventType, setSelectedEventType] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createType, setCreateType] = useState('post');
  const [showJoinForm, setShowJoinForm] = useState(false);
  const [userApprovalStatus, setUserApprovalStatus] = useState('approved'); // For demo purposes
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostCategory, setNewPostCategory] = useState(CATEGORIES[1]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [pollVotes, setPollVotes] = useState({});
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);

  // Load data based on active tab
  useEffect(() => {
    // In a real app, this would fetch from the API
    // For demo, we're using mock data
  }, [activeTab, selectedCategory, selectedEventType]);

  const handleCreatePost = () => {
    if (!newPostTitle.trim() || !newPostContent.trim()) {
      setToast({ type: 'error', message: 'Please fill in all fields' });
      return;
    }

    const newPost = {
      _id: (posts.length + 1).toString(),
      author: {
        name: user?.displayName || 'Current User',
        photoURL: user?.photoURL || '/vite.svg'
      },
      title: newPostTitle,
      content: newPostContent,
      category: newPostCategory,
      tags: [],
      voteCount: 0,
      commentCount: 0,
      views: 0,
      createdAt: new Date().toISOString()
    };

    setPosts([newPost, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setShowCreateModal(false);
    setToast({ type: 'success', message: 'Post created successfully!' });
  };

  const handleVote = (type, id, voteType) => {
    if (userApprovalStatus !== 'approved') {
      setToast({ type: 'error', message: 'You must wait for admin approval to participate in the community.' });
      return;
    }

    // In a real app, this would make an API call
    setToast({ type: 'success', message: `${voteType} recorded successfully` });
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

  const handlePollVote = (optionId) => {
    setPollVotes({ ...pollVotes, [optionId]: true });
    setToast({ type: 'success', message: 'Vote recorded!' });
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
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

          <h3 
            className="text-xl font-semibold text-gray-800 mb-3 hover:text-green-600 cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            {post.title}
          </h3>
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
            <button 
              onClick={() => handlePostClick(post)}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
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
              src={profile.profilePicture || profile.user?.photoURL || '/vite.svg'}
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

  const renderCreatePostModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
        <h3 className="text-xl font-bold mb-4">Create New Post</h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Post title"
            value={newPostTitle}
            onChange={(e) => setNewPostTitle(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
          <select
            value={newPostCategory}
            onChange={(e) => setNewPostCategory(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg"
          >
            {CATEGORIES.filter(cat => cat !== 'All').map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <textarea
            placeholder="What would you like to discuss?"
            value={newPostContent}
            onChange={(e) => setNewPostContent(e.target.value)}
            rows={6}
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={() => setShowCreateModal(false)}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => (
    <div className="lg:w-80 space-y-6">
      {/* Trending Discussions */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
          Trending Discussions
        </h3>
        <div className="space-y-3">
          {TRENDING_DISCUSSIONS.map((discussion) => (
            <div key={discussion.id} className="p-3 hover:bg-green-50 rounded-lg cursor-pointer">
              <h4 className="font-medium text-sm line-clamp-2">{discussion.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{discussion.replies} replies</p>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-green-600" />
          Upcoming Events
        </h3>
        <div className="space-y-3">
          {UPCOMING_EVENTS.map((event) => (
            <div key={event.id} className="p-3 hover:bg-green-50 rounded-lg cursor-pointer">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <p className="text-xs text-gray-500 mt-1">{event.date}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Members */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="font-bold text-lg mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-green-600" />
          Featured Members
        </h3>
        <div className="space-y-3">
          {FEATURED_MEMBERS.map((member) => (
            <div key={member.id} className="flex items-center p-3 hover:bg-green-50 rounded-lg cursor-pointer">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h4 className="font-medium text-sm">{member.name}</h4>
                <p className="text-xs text-gray-500">{member.specialty}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Poll */}
      <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
        <h3 className="font-bold text-lg mb-4">Quick Poll</h3>
        <p className="text-sm mb-4">{QUICK_POLL.question}</p>
        <div className="space-y-2">
          {QUICK_POLL.options.map((option) => (
            <button
              key={option.id}
              onClick={() => handlePollVote(option.id)}
              disabled={pollVotes[option.id]}
              className={`w-full text-left p-3 rounded-lg text-sm ${
                pollVotes[option.id] 
                  ? 'bg-green-100 border border-green-300' 
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex justify-between">
                <span>{option.text}</span>
                {pollVotes[option.id] && <span className="text-green-600">✓ Voted</span>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      
      {/* Enhanced Header with User Profile */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">FarmerAI Community</h1>
              <p className="text-gray-600">Connect with fellow farmers, share knowledge, and grow together</p>
            </div>
            
            {user ? (
              <div className="flex items-center space-x-4">
                <button className="p-2 rounded-full hover:bg-gray-100 relative">
                  <Bell className="w-6 h-6 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                <div className="relative">
                  <button 
                    onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                    className="flex items-center space-x-2"
                  >
                    <img
                      src={user.photoURL || '/vite.svg'}
                      alt={user.displayName}
                      className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
                    />
                    <span className="font-medium text-gray-800 hidden md:block">{user.displayName}</span>
                  </button>
                  
                  {showProfileDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                      <div className="p-4 border-b border-gray-100">
                        <p className="font-medium text-gray-800">{user.displayName}</p>
                        <p className="text-sm text-gray-600">Community Member</p>
                      </div>
                      <div className="py-1">
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          My Profile
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Bookmark className="w-4 h-4 mr-2" />
                          Saved Discussions
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <Settings className="w-4 h-4 mr-2" />
                          Settings
                        </button>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                          <LogOut className="w-4 h-4 mr-2" />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
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
      </div>

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
                onKeyPress={(e) => e.key === 'Enter' && console.log('Search triggered')}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/90 border-2 border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30 transition"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => console.log('Search triggered')}
                className="px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content */}
        <div className="flex-1">
          {/* Create Post Button */}
          {user && activeTab === 'discussions' && (
            <div className="mb-8">
              <div 
                onClick={() => setShowCreateModal(true)}
                className="bg-white/90 backdrop-blur-xl p-6 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)] cursor-pointer hover:shadow-lg transition"
              >
                <div className="flex items-center space-x-4">
                  <img
                    src={user.photoURL || '/vite.svg'}
                    alt={user.displayName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-100"
                  />
                  <div className="flex-1 text-gray-500">
                    What's on your mind, {user.displayName}?
                  </div>
                </div>
              </div>
            </div>
          )}

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

          {/* Enhanced Filters */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-xl p-4 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
              <div className="flex flex-wrap gap-3">
                {activeTab === 'discussions' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                      >
                        {CATEGORIES.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Quick Filter Tags */}
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.slice(1, 6).map((category) => (
                        <button
                          key={category}
                          onClick={() => setSelectedCategory(category)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            selectedCategory === category
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </>
                )}
                
                {activeTab === 'events' && (
                  <>
                    <div className="flex items-center space-x-2">
                      <Filter className="w-4 h-4 text-gray-600" />
                      <select
                        value={selectedEventType}
                        onChange={(e) => setSelectedEventType(e.target.value)}
                        className="px-3 py-2 rounded-lg border border-green-100 focus:border-green-400 focus:ring-2 focus:ring-green-400/30"
                      >
                        {EVENT_TYPES.map((type) => (
                          <option key={type} value={type}>{type === 'All' ? 'All Event Types' : type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Quick Filter Tags */}
                    <div className="flex flex-wrap gap-2">
                      {EVENT_TYPES.slice(1, 5).map((type) => (
                        <button
                          key={type}
                          onClick={() => setSelectedEventType(type)}
                          className={`px-3 py-1 text-sm rounded-full ${
                            selectedEventType === type
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {type.charAt(0).toUpperCase() + type.slice(1)}
                        </button>
                      ))}
                    </div>
                  </>
                )}
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
                {activeTab === 'discussions' && renderPosts()}
                {activeTab === 'events' && renderEvents()}
                {activeTab === 'profiles' && renderProfiles()}
              </>
            )}
          </Section>
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-80">
          {renderSidebar()}
        </div>
      </div>

      {/* Create Post Modal */}
      {showCreateModal && renderCreatePostModal()}

      {/* Post Detail Modal */}
      <PostDetailModal 
        post={selectedPost}
        isOpen={showPostModal}
        onClose={handleCloseModal}
        user={user}
      />

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