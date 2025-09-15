import React, { useState, useEffect } from 'react';
import { 
  UserIcon, 
  MapPinIcon, 
  CalendarIcon,
  StarIcon,
  ChatBubbleLeftIcon as ChatAltIcon,
  HeartIcon,
  EyeIcon,
  MagnifyingGlassIcon as SearchIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

const MemberProfiles = ({ searchQuery }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedCrop, setSelectedCrop] = useState('all');
  const [sortBy, setSortBy] = useState('recent');

  const locations = [
    { id: 'all', label: 'All Locations' },
    { id: 'thrissur', label: 'Thrissur' },
    { id: 'kuttanad', label: 'Kuttanad' },
    { id: 'palakkad', label: 'Palakkad' },
    { id: 'wayanad', label: 'Wayanad' },
    { id: 'idukki', label: 'Idukki' }
  ];

  const crops = [
    { id: 'all', label: 'All Crops' },
    { id: 'paddy', label: 'Paddy' },
    { id: 'rubber', label: 'Rubber' },
    { id: 'coconut', label: 'Coconut' },
    { id: 'vegetables', label: 'Vegetables' },
    { id: 'spices', label: 'Spices' },
    { id: 'fruits', label: 'Fruits' }
  ];

  useEffect(() => {
    fetchProfiles();
  }, [searchQuery, selectedLocation, selectedCrop, sortBy]);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // This would typically fetch from a dedicated profiles endpoint
      // For now, we'll simulate with user data
      const response = await fetch('/api/user/profiles');
      const data = await response.json();
      
      if (data.success) {
        setProfiles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
      // Mock data for demonstration
      setProfiles([
        {
          _id: '1',
          name: 'Rajesh Kumar',
          district: 'Thrissur',
          state: 'Kerala',
          crops: ['paddy', 'vegetables'],
          farmingExperience: 15,
          photoURL: null,
          rating: 4.8,
          totalPosts: 23,
          totalLikes: 156,
          lastActive: '2024-01-15T10:30:00Z',
          bio: 'Experienced paddy farmer with expertise in organic farming techniques.',
          certifications: ['organic', 'pesticide-free']
        },
        {
          _id: '2',
          name: 'Priya Menon',
          district: 'Kuttanad',
          state: 'Kerala',
          crops: ['paddy', 'coconut'],
          farmingExperience: 8,
          photoURL: null,
          rating: 4.6,
          totalPosts: 18,
          totalLikes: 89,
          lastActive: '2024-01-14T15:45:00Z',
          bio: 'Passionate about sustainable farming and helping fellow farmers.',
          certifications: ['organic']
        },
        {
          _id: '3',
          name: 'Suresh Nair',
          district: 'Wayanad',
          state: 'Kerala',
          crops: ['spices', 'coffee'],
          farmingExperience: 25,
          photoURL: null,
          rating: 4.9,
          totalPosts: 45,
          totalLikes: 234,
          lastActive: '2024-01-15T08:20:00Z',
          bio: 'Veteran farmer specializing in spice cultivation and organic practices.',
          certifications: ['organic', 'fair-trade']
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Active now';
    if (diffInHours < 24) return `Active ${diffInHours}h ago`;
    if (diffInHours < 168) return `Active ${Math.floor(diffInHours / 24)}d ago`;
    return `Last seen ${date.toLocaleDateString()}`;
  };

  const ProfileCard = ({ profile }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Profile Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            {profile.photoURL ? (
              <img 
                src={profile.photoURL} 
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {profile.name}
            </h3>
            <div className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm font-medium text-gray-900">{profile.rating}</span>
            </div>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-2">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{profile.district}, {profile.state}</span>
          </div>

          <div className="flex items-center text-sm text-gray-500 mb-3">
            <CalendarIcon className="w-4 h-4 mr-1" />
            <span>{profile.farmingExperience} years experience</span>
          </div>

          {profile.bio && (
            <p className="text-sm text-gray-700 mb-3 line-clamp-2">
              {profile.bio}
            </p>
          )}

          {/* Crops */}
          <div className="flex flex-wrap gap-1 mb-3">
            {profile.crops.map((crop, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
              >
                {crop}
              </span>
            ))}
          </div>

          {/* Certifications */}
          {profile.certifications && profile.certifications.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {profile.certifications.map((cert, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                >
                  ✓ {cert}
                </span>
              ))}
            </div>
          )}

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <div className="flex items-center space-x-1">
              <ChatAltIcon className="w-4 h-4" />
              <span>{profile.totalPosts} posts</span>
            </div>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4" />
              <span>{profile.totalLikes} likes</span>
            </div>
            <div className="flex items-center space-x-1">
              <EyeIcon className="w-4 h-4" />
              <span>{formatDate(profile.lastActive)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 flex space-x-2">
        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
          View Profile
        </button>
        <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
          Message
        </button>
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
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Member Profiles</h2>
        <p className="text-gray-600 mt-1">Connect with experienced farmers in your area</p>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-600">Location:</span>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Crop:</span>
            <select
              value={selectedCrop}
              onChange={(e) => setSelectedCrop(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {crops.map((crop) => (
                <option key={crop.id} value={crop.id}>
                  {crop.label}
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
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="activity">Most Active</option>
            </select>
          </div>
        </div>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No profiles found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchQuery ? 'Try adjusting your search terms.' : 'No farmers found with the selected criteria.'}
            </p>
          </div>
        ) : (
          profiles.map((profile) => (
            <ProfileCard key={profile._id} profile={profile} />
          ))
        )}
      </div>

      {/* Load More Button */}
      {profiles.length > 0 && (
        <div className="mt-6 text-center">
          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
            Load More Profiles
          </button>
        </div>
      )}
    </div>
  );
};

export default MemberProfiles;
