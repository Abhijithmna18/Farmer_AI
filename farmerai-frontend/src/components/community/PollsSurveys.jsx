import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  ClockIcon, 
  UsersIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const PollsSurveys = ({ searchQuery }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const categories = [
    { id: 'all', label: 'All Polls', icon: '📊' },
    { id: 'general', label: 'General', icon: '💬' },
    { id: 'farming-practices', label: 'Farming Practices', icon: '🌾' },
    { id: 'market-trends', label: 'Market Trends', icon: '📈' },
    { id: 'weather', label: 'Weather', icon: '🌤️' },
    { id: 'pest-disease', label: 'Pest & Disease', icon: '🐛' },
    { id: 'irrigation', label: 'Irrigation', icon: '💧' },
    { id: 'soil-health', label: 'Soil Health', icon: '🌱' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'government-schemes', label: 'Government Schemes', icon: '🏛️' },
    { id: 'equipment', label: 'Equipment', icon: '🔧' },
    { id: 'organic-farming', label: 'Organic Farming', icon: '🌿' }
  ];

  const statuses = [
    { id: 'all', label: 'All Status' },
    { id: 'active', label: 'Active' },
    { id: 'ended', label: 'Ended' }
  ];

  useEffect(() => {
    fetchPolls();
  }, [searchQuery, selectedCategory, selectedStatus, sortBy]);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      params.append('sortBy', sortBy === 'recent' ? 'createdAt' : 'totalVotes');
      params.append('sortOrder', 'desc');

      const response = await fetch(`/api/community/polls?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPolls(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching polls:', error);
      // Mock data for demonstration
      setPolls([
        {
          _id: '1',
          title: 'Biggest challenge this planting season?',
          description: 'What is your main concern for the upcoming planting season?',
          type: 'single-choice',
          category: 'farming-practices',
          author: {
            name: 'FarmerAI Team',
            photoURL: null
          },
          options: [
            { _id: '1', text: 'Pest and disease control', votes: 45, percentage: 35 },
            { _id: '2', text: 'Water availability', votes: 38, percentage: 30 },
            { _id: '3', text: 'Soil fertility', votes: 25, percentage: 20 },
            { _id: '4', text: 'Market prices', votes: 20, percentage: 15 }
          ],
          totalVotes: 128,
          uniqueVoters: 95,
          startDate: '2024-01-10T00:00:00Z',
          endDate: '2024-01-25T23:59:59Z',
          isActive: true,
          status: 'active',
          views: 456,
          comments: 23,
          tags: ['planting', 'challenges', 'season'],
          createdAt: '2024-01-10T00:00:00Z',
          hasVoted: false
        },
        {
          _id: '2',
          title: 'Preferred irrigation method',
          description: 'Which irrigation method do you find most effective for your crops?',
          type: 'multiple-choice',
          category: 'irrigation',
          author: {
            name: 'Rajesh Kumar',
            photoURL: null
          },
          options: [
            { _id: '1', text: 'Drip irrigation', votes: 67, percentage: 42 },
            { _id: '2', text: 'Sprinkler irrigation', votes: 45, percentage: 28 },
            { _id: '3', text: 'Flood irrigation', votes: 32, percentage: 20 },
            { _id: '4', text: 'Manual watering', votes: 16, percentage: 10 }
          ],
          totalVotes: 160,
          uniqueVoters: 120,
          startDate: '2024-01-05T00:00:00Z',
          endDate: '2024-01-20T23:59:59Z',
          isActive: false,
          status: 'ended',
          views: 389,
          comments: 18,
          tags: ['irrigation', 'water', 'efficiency'],
          createdAt: '2024-01-05T00:00:00Z',
          hasVoted: true
        },
        {
          _id: '3',
          title: 'Government scheme awareness',
          description: 'How familiar are you with current government agricultural schemes?',
          type: 'single-choice',
          category: 'government-schemes',
          author: {
            name: 'Priya Menon',
            photoURL: null
          },
          options: [
            { _id: '1', text: 'Very familiar', votes: 15, percentage: 12 },
            { _id: '2', text: 'Somewhat familiar', votes: 45, percentage: 36 },
            { _id: '3', text: 'Not very familiar', votes: 38, percentage: 30 },
            { _id: '4', text: 'Not familiar at all', votes: 27, percentage: 22 }
          ],
          totalVotes: 125,
          uniqueVoters: 98,
          startDate: '2024-01-12T00:00:00Z',
          endDate: '2024-01-30T23:59:59Z',
          isActive: true,
          status: 'active',
          views: 234,
          comments: 12,
          tags: ['government', 'schemes', 'awareness'],
          createdAt: '2024-01-12T00:00:00Z',
          hasVoted: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (pollId, optionIds) => {
    try {
      const response = await fetch(`/api/community/polls/${pollId}/vote`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ optionIds })
      });
      
      if (response.ok) {
        fetchPolls(); // Refresh polls
      }
    } catch (error) {
      console.error('Error voting on poll:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (endDate) => {
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const PollCard = ({ poll }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(poll.status)}`}>
              {poll.status === 'active' && '🟢 '}
              {poll.status === 'ended' && '🔴 '}
              {poll.status.charAt(0).toUpperCase() + poll.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">{poll.type.replace('-', ' ')}</span>
            {poll.isActive && poll.status === 'active' && (
              <span className="text-sm text-orange-600">
                {getDaysRemaining(poll.endDate)} days left
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {poll.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {poll.description}
          </p>
        </div>
      </div>

      {/* Poll Options */}
      <div className="space-y-3 mb-4">
        {poll.options.map((option) => (
          <div key={option._id} className="relative">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{option.text}</span>
              <span className="text-sm text-gray-500">{option.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${option.percentage}%` }}
              ></div>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-xs text-gray-500">{option.votes} votes</span>
              {poll.hasVoted && (
                <span className="text-xs text-green-600">✓ Voted</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Poll Stats */}
      <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <UsersIcon className="w-4 h-4" />
            <span>{poll.totalVotes} total votes</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChartBarIcon className="w-4 h-4" />
            <span>{poll.uniqueVoters} voters</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="w-4 h-4" />
            <span>Ends {formatDate(poll.endDate)}</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <span>👁️ {poll.views}</span>
          </div>
          <div className="flex items-center space-x-1">
            <ChatBubbleLeftIcon className="w-4 h-4" />
            <span>{poll.comments}</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      {poll.tags && poll.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {poll.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        {poll.status === 'active' && !poll.hasVoted ? (
          <button
            onClick={() => handleVote(poll._id, [poll.options[0]._id])}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors"
          >
            Vote Now
          </button>
        ) : poll.status === 'active' && poll.hasVoted ? (
          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
            Already Voted
          </button>
        ) : (
          <button className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium cursor-not-allowed">
            Poll Ended
          </button>
        )}
        
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          View Results
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          Share
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Polls & Surveys</h2>
          <p className="text-gray-600 mt-1">Share your opinion and see what other farmers think</p>
        </div>
        
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Poll
        </button>
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
            <span className="text-sm text-gray-600">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {statuses.map((status) => (
                <option key={status.id} value={status.id}>
                  {status.label}
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
              <option value="ending">Ending Soon</option>
            </select>
          </div>
        </div>
      </div>

      {/* Polls */}
      <div className="space-y-4">
        {polls.length === 0 ? (
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No polls found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'No polls available in the selected category.'}
            </p>
          </div>
        ) : (
          polls.map((poll) => (
            <PollCard key={poll._id} poll={poll} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {polls.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Polls
          </button>
        </div>
      )}
    </div>
  );
};

export default PollsSurveys;
