import React, { useState, useEffect } from 'react';
import { 
  BookOpenIcon, 
  StarIcon, 
  HeartIcon, 
  BookmarkIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon,
  ClockIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';

const KnowledgeBase = ({ searchQuery }) => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const categories = [
    { id: 'all', label: 'All Articles', icon: '📚' },
    { id: 'crop-guides', label: 'Crop Guides', icon: '🌾' },
    { id: 'pest-disease', label: 'Pest & Disease', icon: '🐛' },
    { id: 'irrigation', label: 'Irrigation', icon: '💧' },
    { id: 'soil-health', label: 'Soil Health', icon: '🌱' },
    { id: 'organic-farming', label: 'Organic Farming', icon: '🌿' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'government-schemes', label: 'Government Schemes', icon: '🏛️' },
    { id: 'tutorials', label: 'Tutorials', icon: '🎓' },
    { id: 'faq', label: 'FAQ', icon: '❓' }
  ];

  const difficulties = [
    { id: 'all', label: 'All Levels' },
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' }
  ];

  useEffect(() => {
    fetchArticles();
  }, [searchQuery, selectedCategory, selectedDifficulty, sortBy]);

  const fetchArticles = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
      params.append('sortBy', sortBy === 'recent' ? 'createdAt' : 'views');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/community/articles?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setArticles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
      // Mock data for demonstration
      setArticles([
        {
          _id: '1',
          title: 'Complete Guide to Paddy Cultivation',
          excerpt: 'A comprehensive guide covering all aspects of paddy cultivation from seed selection to harvest.',
          category: 'crop-guides',
          difficulty: 'intermediate',
          author: {
            name: 'Dr. Rajesh Kumar',
            photoURL: null,
            district: 'Thrissur',
            state: 'Kerala'
          },
          views: 1250,
          likeCount: 89,
          bookmarkCount: 45,
          commentCount: 23,
          averageRating: 4.8,
          totalRatings: 67,
          estimatedReadTime: 15,
          tags: ['paddy', 'cultivation', 'rice', 'farming'],
          images: [],
          createdAt: '2024-01-10T10:00:00Z',
          isFeatured: true,
          isPinned: false
        },
        {
          _id: '2',
          title: 'Organic Pest Control Methods',
          excerpt: 'Learn effective organic methods to control common pests without using harmful chemicals.',
          category: 'pest-disease',
          difficulty: 'beginner',
          author: {
            name: 'Priya Menon',
            photoURL: null,
            district: 'Kuttanad',
            state: 'Kerala'
          },
          views: 890,
          likeCount: 67,
          bookmarkCount: 34,
          commentCount: 18,
          averageRating: 4.6,
          totalRatings: 45,
          estimatedReadTime: 8,
          tags: ['organic', 'pest-control', 'natural', 'sustainable'],
          images: [],
          createdAt: '2024-01-08T14:30:00Z',
          isFeatured: false,
          isPinned: true
        },
        {
          _id: '3',
          title: 'Drip Irrigation Setup Guide',
          excerpt: 'Step-by-step guide to setting up efficient drip irrigation systems for your farm.',
          category: 'irrigation',
          difficulty: 'intermediate',
          author: {
            name: 'Suresh Nair',
            photoURL: null,
            district: 'Wayanad',
            state: 'Kerala'
          },
          views: 756,
          likeCount: 54,
          bookmarkCount: 28,
          commentCount: 15,
          averageRating: 4.7,
          totalRatings: 38,
          estimatedReadTime: 12,
          tags: ['irrigation', 'drip', 'water-management', 'efficiency'],
          images: [],
          createdAt: '2024-01-05T09:15:00Z',
          isFeatured: false,
          isPinned: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (articleId) => {
    try {
      const response = await fetch(`/api/community/articles/${articleId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchArticles(); // Refresh articles
      }
    } catch (error) {
      console.error('Error liking article:', error);
    }
  };

  const handleBookmark = async (articleId) => {
    try {
      const response = await fetch(`/api/community/articles/${articleId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchArticles(); // Refresh articles
      }
    } catch (error) {
      console.error('Error bookmarking article:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ArticleCard = ({ article }) => (
    <div className="border-b border-gray-200 p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start space-x-4">
        {/* Article Image */}
        <div className="flex-shrink-0">
          {article.images && article.images.length > 0 ? (
            <img 
              src={article.images[0].url} 
              alt={article.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          ) : (
            <div className="w-24 h-24 bg-green-100 rounded-lg flex items-center justify-center">
              <BookOpenIcon className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>

        {/* Article Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(article.difficulty)}`}>
              {article.difficulty}
            </span>
            {article.isFeatured && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                ⭐ Featured
              </span>
            )}
            {article.isPinned && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                📌 Pinned
              </span>
            )}
          </div>

          <h2 className="text-xl font-semibold text-gray-900 mb-2 hover:text-green-600 cursor-pointer">
            {article.title}
          </h2>

          <p className="text-gray-600 mb-3 line-clamp-2">
            {article.excerpt}
          </p>

          {/* Author Info */}
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center space-x-1">
              <UserIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{article.author?.name}</span>
            </div>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-500">{formatDate(article.createdAt)}</span>
            <span className="text-sm text-gray-400">•</span>
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{article.estimatedReadTime} min read</span>
            </div>
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {article.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats and Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-1 text-gray-500">
                <EyeIcon className="w-4 h-4" />
                <span className="text-sm">{article.views}</span>
              </div>
              
              <div className="flex items-center space-x-1 text-gray-500">
                <StarIcon className="w-4 h-4" />
                <span className="text-sm">{article.averageRating}</span>
                <span className="text-xs text-gray-400">({article.totalRatings})</span>
              </div>
              
              <button
                onClick={() => handleLike(article._id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
              >
                {article.liked ? (
                  <HeartSolidIcon className="w-4 h-4 text-red-500" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span className="text-sm">{article.likeCount}</span>
              </button>
              
              <button
                onClick={() => handleBookmark(article._id)}
                className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                {article.bookmarked ? (
                  <BookmarkSolidIcon className="w-4 h-4 text-blue-500" />
                ) : (
                  <BookmarkIcon className="w-4 h-4" />
                )}
                <span className="text-sm">{article.bookmarkCount}</span>
              </button>
              
              <div className="flex items-center space-x-1 text-gray-500">
                <ChatBubbleLeftIcon className="w-4 h-4" />
                <span className="text-sm">{article.commentCount}</span>
              </div>
            </div>

            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Read Article
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border-b border-gray-200 p-6">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Knowledge Base</h2>
        <p className="text-gray-600 mt-1">Learn from expert farmers and agricultural specialists</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
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
            <span className="text-sm text-gray-600">Difficulty:</span>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {difficulties.map((difficulty) => (
                <option key={difficulty.id} value={difficulty.id}>
                  {difficulty.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              <option value="recent">Most Recent</option>
              <option value="popular">Most Popular</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles */}
      <div className="space-y-0">
        {articles.length === 0 ? (
          <div className="text-center py-12">
            <BookOpenIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No articles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'No articles available in the selected category.'}
            </p>
          </div>
        ) : (
          articles.map((article) => (
            <ArticleCard key={article._id} article={article} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {articles.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Articles
          </button>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBase;
