import React, { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  MapPinIcon, 
  UsersIcon,
  ChatBubbleLeftIcon as ChatAltIcon,
  CalendarIcon,
  PlusIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon,
  EyeIcon
} from '@heroicons/react/24/outline';

const LocalGroups = ({ searchQuery }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('members');

  const groupTypes = [
    { id: 'all', label: 'All Groups', icon: '👥' },
    { id: 'location', label: 'Location-based', icon: '📍' },
    { id: 'crop', label: 'Crop-specific', icon: '🌾' },
    { id: 'interest', label: 'Interest-based', icon: '💡' },
    { id: 'general', label: 'General', icon: '🌐' }
  ];

  const categories = [
    { id: 'all', label: 'All Categories' },
    { id: 'paddy', label: 'Paddy Farmers' },
    { id: 'rubber', label: 'Rubber Growers' },
    { id: 'coconut', label: 'Coconut Farmers' },
    { id: 'vegetables', label: 'Vegetable Farmers' },
    { id: 'spices', label: 'Spice Growers' },
    { id: 'organic', label: 'Organic Farming' },
    { id: 'irrigation', label: 'Irrigation' },
    { id: 'pest-control', label: 'Pest Control' },
    { id: 'soil-health', label: 'Soil Health' },
    { id: 'technology', label: 'Technology' },
    { id: 'equipment', label: 'Equipment' },
    { id: 'marketplace', label: 'Marketplace' },
    { id: 'general', label: 'General Discussion' }
  ];

  useEffect(() => {
    fetchGroups();
  }, [searchQuery, selectedType, selectedCategory, sortBy]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      params.append('sortBy', sortBy);

      const response = await fetch(`/api/community/groups?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setGroups(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      // Mock data for demonstration
      setGroups([
        {
          _id: '1',
          name: 'Thrissur Paddy Farmers',
          description: 'A community of paddy farmers in Thrissur district sharing knowledge and experiences.',
          type: 'location',
          category: 'paddy',
          coverImage: null,
          profileImage: null,
          location: {
            district: 'Thrissur',
            state: 'Kerala'
          },
          createdBy: {
            name: 'Rajesh Kumar',
            photoURL: null
          },
          stats: {
            memberCount: 156,
            postCount: 234,
            eventCount: 12
          },
          visibility: 'public',
          joinApproval: false,
          tags: ['paddy', 'thrissur', 'rice', 'farming'],
          lastActivity: '2024-01-15T10:30:00Z',
          isJoined: false
        },
        {
          _id: '2',
          name: 'Kuttanad Growers Collective',
          description: 'Supporting farmers in the unique Kuttanad region with specialized farming techniques.',
          type: 'location',
          category: 'general',
          coverImage: null,
          profileImage: null,
          location: {
            district: 'Kuttanad',
            state: 'Kerala'
          },
          createdBy: {
            name: 'Priya Menon',
            photoURL: null
          },
          stats: {
            memberCount: 89,
            postCount: 145,
            eventCount: 8
          },
          visibility: 'public',
          joinApproval: false,
          tags: ['kuttanad', 'collective', 'farming', 'community'],
          lastActivity: '2024-01-14T15:45:00Z',
          isJoined: true
        },
        {
          _id: '3',
          name: 'Organic Farming Enthusiasts',
          description: 'Dedicated to promoting organic farming practices and sustainable agriculture.',
          type: 'interest',
          category: 'organic',
          coverImage: null,
          profileImage: null,
          location: {
            district: 'Wayanad',
            state: 'Kerala'
          },
          createdBy: {
            name: 'Suresh Nair',
            photoURL: null
          },
          stats: {
            memberCount: 203,
            postCount: 456,
            eventCount: 15
          },
          visibility: 'public',
          joinApproval: true,
          tags: ['organic', 'sustainable', 'environment', 'farming'],
          lastActivity: '2024-01-15T08:20:00Z',
          isJoined: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/community/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchGroups(); // Refresh groups
      }
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  const handleLeaveGroup = async (groupId) => {
    try {
      const response = await fetch(`/api/community/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchGroups(); // Refresh groups
      }
    } catch (error) {
      console.error('Error leaving group:', error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    if (diffInHours < 168) return `Active ${Math.floor(diffInHours / 24)}d ago`;
    return `Last active ${date.toLocaleDateString()}`;
  };

  const getGroupTypeIcon = (type) => {
    const typeInfo = groupTypes.find(t => t.id === type);
    return typeInfo ? typeInfo.icon : '👥';
  };

  const GroupCard = ({ group }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Group Image */}
        <div className="flex-shrink-0">
          {group.profileImage ? (
            <img 
              src={group.profileImage} 
              alt={group.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
          ) : (
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
              <UserGroupIcon className="w-8 h-8 text-green-600" />
            </div>
          )}
        </div>

        {/* Group Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {group.name}
            </h3>
            <span className="text-lg">{getGroupTypeIcon(group.type)}</span>
            {group.visibility === 'private' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Private
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-3 line-clamp-2">
            {group.description}
          </p>

          {/* Location */}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{group.location?.district}, {group.location?.state}</span>
          </div>

          {/* Tags */}
          {group.tags && group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {group.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center space-x-1">
              <UsersIcon className="w-4 h-4" />
              <span>{group.stats?.memberCount || 0} members</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChatAltIcon className="w-4 h-4" />
              <span>{group.stats?.postCount || 0} posts</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarIcon className="w-4 h-4" />
              <span>{group.stats?.eventCount || 0} events</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{formatDate(group.lastActivity)}</span>
            </div>
          </div>

          {/* Created by */}
          <div className="text-sm text-gray-500 mb-4">
            Created by <span className="font-medium">{group.createdBy?.name}</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
          View Group
        </button>
        
        {group.isJoined ? (
          <button
            onClick={() => handleLeaveGroup(group._id)}
            className="px-4 py-2 border border-red-300 text-red-700 rounded-md text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Leave Group
          </button>
        ) : (
          <button
            onClick={() => handleJoinGroup(group._id)}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            {group.joinApproval ? 'Request to Join' : 'Join Group'}
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
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
          <h2 className="text-2xl font-bold text-gray-900">Local Groups</h2>
          <p className="text-gray-600 mt-1">Connect with farmers in your area or with similar interests</p>
        </div>
        
        <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Group
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-2 mb-4">
          {groupTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedType === type.id
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span className="mr-2">{type.icon}</span>
              {type.label}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.label}
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
              <option value="members">Most Members</option>
              <option value="recent">Most Recent</option>
              <option value="active">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No groups found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'No groups found with the selected criteria.'}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <GroupCard key={group._id} group={group} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {groups.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Groups
          </button>
        </div>
      )}
    </div>
  );
};

export default LocalGroups;
