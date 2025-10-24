import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import PostDetailModal from './PostDetailModal';
import { 
  ChatBubbleLeftIcon as ChatAltIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  EyeIcon,
  ShareIcon,
  FlagIcon,
  PlusIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const DiscussionForum = ({ searchQuery }) => {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPostModal, setShowPostModal] = useState(false);

  const categories = [
    { id: 'all', label: 'All Discussions', icon: '💬' },
    { id: 'crop-specific', label: 'Crop-Specific Questions', icon: '🌾' },
    { id: 'pest-disease', label: 'Pest & Disease Control', icon: '🐛' },
    { id: 'irrigation', label: 'Irrigation Techniques', icon: '💧' },
    { id: 'soil-health', label: 'Soil Health', icon: '🌱' },
    { id: 'app-support', label: 'FarmerAI App Support', icon: '📱' },
    { id: 'government-schemes', label: 'Government Schemes', icon: '🏛️' },
    { id: 'marketplace', label: 'Marketplace', icon: '🛒' },
    { id: 'weather', label: 'Weather', icon: '🌤️' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'organic-farming', label: 'Organic Farming', icon: '🌿' },
    { id: 'technology', label: 'Technology', icon: '💻' }
  ];

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, searchQuery, sortBy]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sortBy', sortBy === 'newest' ? 'createdAt' : 'views');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/community/posts?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPosts(data.data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/community/posts/${postId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchPosts(); // Refresh posts
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handlePostClick = (post) => {
    setSelectedPost(post);
    setShowPostModal(true);
  };

  const handleCloseModal = () => {
    setShowPostModal(false);
    setSelectedPost(null);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const PostCard = ({ post }) => (
    <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Author Avatar */}
        <div className="flex-shrink-0">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            {post.author?.photoURL ? (
              <img 
                src={post.author.photoURL} 
                alt={post.author.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <span className="text-green-600 font-semibold text-sm">
                {post.author?.name?.charAt(0) || 'F'}
              </span>
            )}
          </div>
        </div>

        {/* Post Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-sm font-medium text-gray-900">
              {post.author?.name || 'Anonymous'}
            </h3>
            <span className="text-xs text-gray-500">
              {post.author?.district && `${post.author.district}, `}
              {post.author?.state}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {formatDate(post.createdAt)}
            </span>
            {post.expertVerified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ✓ Expert Verified
              </span>
            )}
          </div>

          <h2 
            className="text-lg font-semibold text-gray-900 mb-2 hover:text-green-600 cursor-pointer"
            onClick={() => handlePostClick(post)}
          >
            {post.title}
          </h2>

          <p className="text-gray-700 mb-4 line-clamp-3">
            {post.content}
          </p>

          {/* Post Images */}
          {post.images && post.images.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {post.images.slice(0, 3).map((image, index) => (
                  <img
                    key={index}
                    src={image.url}
                    alt={image.alt || 'Post image'}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ))}
                {post.images.length > 3 && (
                  <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-gray-500 text-sm">+{post.images.length - 3} more</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Post Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Post Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => handleLike(post._id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                {post.likes?.includes(user?.id) ? (
                  <HeartSolidIcon className="h-5 w-5 text-red-500" />
                ) : (
                  <HeartIcon className="h-5 w-5" />
                )}
                <span className="text-sm">{post.likeCount || 0}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                <ChatBubbleLeftIcon className="h-5 w-5" />
                <span className="text-sm">{post.commentCount || 0}</span>
              </button>
              
              <button className="flex items-center space-x-1 text-gray-500 hover:text-green-500 transition-colors">
                <EyeIcon className="h-5 w-5" />
                <span className="text-sm">{post.views || 0}</span>
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                <ShareIcon className="h-5 w-5" />
              </button>
              <button className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                <FlagIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discussion Forum</h2>
          <p className="text-gray-600 mt-1">Share knowledge, ask questions, and connect with fellow farmers</p>
        </div>
        
        {user && (
          <button
            onClick={() => setShowCreatePost(true)}
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Discussion
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-0">
        {posts.length === 0 ? (
          <div className="text-center py-12">
            <ChatAltIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No discussions found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'Be the first to start a discussion!'}
            </p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {posts.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Discussions
          </button>
        </div>
      )}

      {/* Post Detail Modal */}
      <PostDetailModal 
        post={selectedPost}
        isOpen={showPostModal}
        onClose={handleCloseModal}
        user={user}
      />
    </div>
  );
};

export default DiscussionForum;