import React, { useState } from 'react';
import { 
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

const PostDetailModal = ({ post, isOpen, onClose }) => {
  const [likedComments, setLikedComments] = useState(new Set());

  if (!isOpen || !post) return null;

  // Dummy answers/replies
  const dummyAnswers = [
    {
      id: 1,
      author: {
        name: "Farmer A",
        photoURL: null,
        district: "Thrissur",
        state: "Kerala"
      },
      content: "You can try drip irrigation for better results. It's more water-efficient and helps control the moisture level better.",
      likes: 12,
      createdAt: "2024-01-15T10:30:00Z",
      isExpert: true
    },
    {
      id: 2,
      author: {
        name: "Rajesh Kumar",
        photoURL: null,
        district: "Kuttanad",
        state: "Kerala"
      },
      content: "I've been using neem oil spray to control pests naturally. Mix 2ml neem oil with 1 liter water and spray every 15 days. It's very effective!",
      likes: 8,
      createdAt: "2024-01-15T11:15:00Z",
      isExpert: false
    },
    {
      id: 3,
      author: {
        name: "Priya Menon",
        photoURL: null,
        district: "Wayanad",
        state: "Kerala"
      },
      content: "For soil health, I recommend adding organic compost and doing regular soil testing. Also, crop rotation helps maintain soil fertility.",
      likes: 15,
      createdAt: "2024-01-15T12:45:00Z",
      isExpert: false
    },
    {
      id: 4,
      author: {
        name: "Dr. Suresh Nair",
        photoURL: null,
        district: "Palakkad",
        state: "Kerala"
      },
      content: "Based on my experience, the key is proper timing. For paddy, transplant when seedlings are 20-25 days old. Also, ensure proper spacing of 20x20 cm.",
      likes: 23,
      createdAt: "2024-01-15T14:20:00Z",
      isExpert: true
    }
  ];

  const handleLikeComment = (commentId) => {
    setLikedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Discussion Details</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Original Post */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
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

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {post.author?.name || 'Anonymous'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {post.author?.district && `${post.author.district}, `}
                      {post.author?.state}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(post.createdAt)}
                    </span>
                    {post.expertVerified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Expert Verified
                      </span>
                    )}
                  </div>

                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {post.title}
                  </h2>

                  <p className="text-gray-700 dark:text-gray-300 mb-4">
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
                </div>
              </div>
            </div>

            {/* Answers/Replies */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Answers ({dummyAnswers.length})
              </h3>

              <div className="space-y-4">
                {dummyAnswers.map((answer) => (
                  <div key={answer.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                          {answer.author.photoURL ? (
                            <img 
                              src={answer.author.photoURL} 
                              alt={answer.author.name}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-4 h-4 text-green-600" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {answer.author.name}
                          </h4>
                          {answer.isExpert && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Expert
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {answer.author.district}, {answer.author.state}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(answer.createdAt)}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-3">
                          {answer.content}
                        </p>

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikeComment(answer.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            {likedComments.has(answer.id) ? (
                              <HeartSolidIcon className="w-4 h-4 text-red-500" />
                            ) : (
                              <HeartIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm">{answer.likes}</span>
                          </button>
                          
                          <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                            <ChatBubbleLeftIcon className="w-4 h-4" />
                            <span className="text-sm">Reply</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Answer Form */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Write your answer..."
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                    ></textarea>
                    <div className="flex justify-end mt-2">
                      <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
                        Post Answer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
