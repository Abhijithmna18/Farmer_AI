import React from 'react';
import { MagnifyingGlassIcon as SearchIcon, UsersIcon, ChatBubbleLeftIcon as ChatAltIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const CommunityHeader = ({ stats, onSearch, searchQuery }) => {
  return (
    <div className="relative">
      {/* Banner Image */}
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden">
        <img 
          src="/Community Event.png" 
          alt="FarmerAI Community Event"
          className="w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        
        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-white px-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 drop-shadow-lg dark:text-white">
              FarmerAI Community
            </h1>
            <p className="text-lg md:text-xl text-green-100 max-w-3xl mx-auto drop-shadow-md dark:text-green-200">
              Connect with fellow farmers, share knowledge, ask questions, and grow together in our vibrant agricultural community.
            </p>
          </div>
        </div>
      </div>

      {/* Search and Stats Section */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search discussions, articles, polls, and more..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
            />
          </div>
        </div>

          {/* Community Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500 rounded-lg">
                  <ChatAltIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold">{stats.stats?.totalPosts || 0}</div>
                <div className="text-sm text-green-100">Discussions</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500 rounded-lg">
                  <UsersIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold">{stats.stats?.totalGroups || 0}</div>
                <div className="text-sm text-green-100">Groups</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500 rounded-lg">
                  <BookOpenIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-2xl font-bold">{stats.stats?.totalArticles || 0}</div>
                <div className="text-sm text-green-100">Articles</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 bg-green-500 rounded-lg">
                  <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-2xl font-bold">{stats.stats?.totalPolls || 0}</div>
                <div className="text-sm text-green-100">Polls</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityHeader;
