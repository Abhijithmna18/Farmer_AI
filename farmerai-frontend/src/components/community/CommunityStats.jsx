import React from 'react';
import { 
  ChatBubbleLeftIcon as ChatAltIcon, 
  UsersIcon, 
  BookOpenIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const CommunityStats = ({ stats }) => {
  if (!stats) return null;

  return (
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
          <ChartBarIcon className="h-6 w-6 text-white" />
        </div>
        <div className="text-2xl font-bold">{stats.stats?.totalPolls || 0}</div>
        <div className="text-sm text-green-100">Polls</div>
      </div>
    </div>
  );
};

export default CommunityStats;
