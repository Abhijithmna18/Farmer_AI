import React, { useState } from 'react';
import { 
  XMarkIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  UserIcon,
  ArrowLeftIcon,
  ShareIcon,
  FlagIcon,
  BookmarkIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

// Mock data for detailed post view
const MOCK_POSTS = {
  '1': {
    _id: '1',
    author: {
      name: "Ramesh Kumar",
      photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
      district: "Ludhiana",
      state: "Punjab",
      reputation: 1240
    },
    title: "Problem: Yellow mosaic virus in my soybean crop. Any AI-based solutions?",
    content: "I've been noticing yellow patches on my soybean leaves and reduced yield this season. Has anyone used AI tools to detect and manage this issue? Looking for recommendations on both detection and treatment approaches.\n\nAdditional details:\n- Farm location: Ludhiana, Punjab\n- Crop area: 25 acres\n- Symptoms started 3 weeks ago\n- Already tried neem oil spray with limited success\n\nAny help would be greatly appreciated!",
    category: "Pest & Disease Control",
    tags: ["soybean", "virus", "AI detection", "Punjab"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1592135400356-78e9b4d3a9d0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        alt: "Soybean leaves with yellow mosaic virus"
      },
      {
        url: "https://images.unsplash.com/photo-1592135400356-78e9b4d3a9d1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        alt: "Affected soybean field"
      }
    ],
    expertVerified: true,
    likeCount: 24,
    commentCount: 8,
    views: 128,
    createdAt: "2025-10-20T10:30:00Z",
    updatedAt: "2025-10-22T14:15:00Z"
  },
  '2': {
    _id: '2',
    author: {
      name: "Priya S.",
      photoURL: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
      district: "Bangalore",
      state: "Karnataka",
      reputation: 890
    },
    title: "Best practices for using drone data for irrigation?",
    content: "I recently got a drone with multispectral imaging for my 50-acre farm. What are the best practices for analyzing the data to optimize irrigation? Any software recommendations?\n\nCurrent setup:\n- DJI Phantom 4 Multispectral\n- 50 acres of mixed crops (vegetables and fruits)\n- Drip irrigation system already installed\n\nLooking for:\n1. Software for analyzing multispectral data\n2. Integration with irrigation scheduling\n3. ROI calculations for precision irrigation",
    category: "Technology",
    tags: ["drone", "irrigation", "multispectral", "precision farming"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1592135400356-78e9b4d3a9d2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        alt: "Drone flying over farmland"
      }
    ],
    expertVerified: false,
    likeCount: 18,
    commentCount: 7,
    views: 96,
    createdAt: "2025-10-21T14:15:00Z",
    updatedAt: "2025-10-23T09:30:00Z"
  },
  '3': {
    _id: '3',
    author: {
      name: "Anjali Desai",
      photoURL: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
      district: "Ahmedabad",
      state: "Gujarat",
      reputation: 1560
    },
    title: "Sharing my success with AI-powered crop rotation!",
    content: "After implementing AI-recommended crop rotation for 2 years, my yields have increased by 25% and soil health has improved significantly. Happy to share my experience and data!\n\nMy journey:\n- Started with FarmerAI's crop rotation tool in 2023\n- 25-acre mixed farm (cotton, wheat, vegetables)\n- Previously struggling with soil depletion\n\nResults:\n- 25% yield increase across all crops\n- 30% reduction in fertilizer use\n- Better pest management through rotation\n\nWould love to connect with others interested in AI tools for farming!",
    category: "Success Stories",
    tags: ["crop rotation", "AI", "yield increase", "soil health"],
    images: [
      {
        url: "https://images.unsplash.com/photo-1592135400356-78e9b4d3a9d3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        alt: "Diverse crops in rotation"
      },
      {
        url: "https://images.unsplash.com/photo-1592135400356-78e9b4d3a9d4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&h=400&q=80",
        alt: "Soil health improvement chart"
      }
    ],
    expertVerified: true,
    likeCount: 42,
    commentCount: 12,
    views: 210,
    createdAt: "2025-10-22T09:45:00Z",
    updatedAt: "2025-10-24T11:20:00Z"
  }
};

// Mock comments data
const MOCK_COMMENTS = {
  '1': [
    {
      id: '101',
      author: {
        name: "Dr. Anand Sharma",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
        district: "New Delhi",
        state: "Delhi",
        reputation: 2450,
        isExpert: true
      },
      content: "Yellow mosaic virus is a serious concern for soybean farmers. For AI-based detection, I recommend using multispectral imaging with NDVI analysis. There are several tools available:\n\n1. FarmerAI's own pest detection module (most accurate for Indian conditions)\n2. Plantix app with premium features\n3. Agrio for comprehensive crop monitoring\n\nFor treatment:\n- Immediate removal of infected plants\n- Neem-based biopesticides (as you've tried)\n- Introduce beneficial insects like ladybugs\n- Consider resistant soybean varieties for next season",
      likes: 15,
      createdAt: "2025-10-20T12:15:00Z",
      isExpert: true
    },
    {
      id: '102',
      author: {
        name: "Karan Singh",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
        district: "Ludhiana",
        state: "Punjab",
        reputation: 890,
        isExpert: false
      },
      content: "I faced the same issue last year. What worked for me:\n\n1. Removed all infected plants immediately\n2. Applied Trichoderma-based biocontrol agent\n3. Sprayed neem oil + garlic extract (10ml neem oil + 5gm garlic paste per liter water)\n4. Used resistant variety JS 335 in next season\n\nYield loss was about 15% but manageable. For detection, try the free version of Plantix - it's quite accurate for viral diseases.",
      likes: 8,
      createdAt: "2025-10-20T14:30:00Z",
      isExpert: false
    }
  ],
  '2': [
    {
      id: '201',
      author: {
        name: "Dr. Suresh Nair",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
        district: "Palakkad",
        state: "Kerala",
        reputation: 1890,
        isExpert: true
      },
      content: "Great question about drone data for irrigation! For analyzing multispectral data, here are my top recommendations:\n\n1. **AgEagle** - Best for beginners, integrates well with DJI drones\n2. **Pix4D Fields** - Excellent for agriculture-specific analysis\n3. **DroneDeploy** - Comprehensive platform with irrigation modules\n\nFor irrigation scheduling:\n- Use NDVI maps to identify water-stressed areas\n- Create variable rate irrigation prescriptions\n- Monitor crop health over time\n\nROI typically seen within 12-18 months through water savings and yield optimization. Would be happy to connect for more detailed guidance!",
      likes: 18,
      createdAt: "2025-10-21T16:30:00Z",
      isExpert: true
    }
  ],
  '3': [
    {
      id: '301',
      author: {
        name: "FarmerAI Team",
        photoURL: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f32?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80",
        district: "New Delhi",
        state: "Delhi",
        reputation: 3200,
        isExpert: true
      },
      content: "Congratulations on your success with AI-powered crop rotation, Anjali! Your results are impressive and align with what we've seen across our user base. The 25% yield increase is particularly noteworthy.\n\nWe'd love to feature your story in our success case studies. Would you be interested in sharing more detailed data (anonymized, of course) for our research? This would help other farmers in similar conditions.\n\nYour experience validates our approach to using machine learning for crop rotation optimization. Keep up the great work!",
      likes: 22,
      createdAt: "2025-10-22T11:30:00Z",
      isExpert: true
    }
  ]
};

const PostDetailModal = ({ post, isOpen, onClose, user }) => {
  const [likedComments, setLikedComments] = useState(new Set());
  const [bookmarked, setBookmarked] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState(MOCK_COMMENTS[post?._id] || []);

  if (!isOpen || !post) return null;

  // Get the detailed post data
  const detailedPost = MOCK_POSTS[post._id] || post;

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

  const handleAddComment = () => {
    if (newComment.trim()) {
      // Create a new comment object
      const comment = {
        id: `new-${Date.now()}`,
        author: {
          name: user?.displayName || 'Current User',
          photoURL: user?.photoURL || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&h=100&q=80',
          district: 'Your District',
          state: 'Your State',
          reputation: 0,
          isExpert: false
        },
        content: newComment,
        likes: 0,
        createdAt: new Date().toISOString()
      };
      
      // Add to comments list
      setComments(prev => [...prev, comment]);
      setNewComment('');
    }
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

  const formatFullDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    {detailedPost.author?.photoURL ? (
                      <img 
                        src={detailedPost.author.photoURL} 
                        alt={detailedPost.author.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-green-600 font-semibold">
                        {detailedPost.author?.name?.charAt(0) || 'F'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {detailedPost.author?.name || 'Anonymous'}
                    </h3>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {detailedPost.author?.district && `${detailedPost.author.district}, `}
                      {detailedPost.author?.state}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(detailedPost.createdAt)}
                    </span>
                    {detailedPost.expertVerified && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ✓ Expert Verified
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 mb-3">
                    <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                      {detailedPost.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      {detailedPost.views} views
                    </span>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                    {detailedPost.title}
                  </h2>

                  <div className="prose max-w-none text-gray-700 dark:text-gray-300 mb-4 whitespace-pre-line">
                    {detailedPost.content}
                  </div>

                  {/* Post Images */}
                  {detailedPost.images && detailedPost.images.length > 0 && (
                    <div className="mb-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {detailedPost.images.map((image, index) => (
                          <div key={index} className="rounded-lg overflow-hidden">
                            <img
                              src={image.url}
                              alt={image.alt || 'Post image'}
                              className="w-full h-48 object-cover"
                            />
                            {image.alt && (
                              <p className="text-xs text-gray-500 mt-1">{image.alt}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Post Tags */}
                  {detailedPost.tags && detailedPost.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {detailedPost.tags.map((tag, index) => (
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
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center space-x-6">
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors">
                        <HeartIcon className="w-5 h-5" />
                        <span>{detailedPost.likeCount || 0}</span>
                      </button>
                      
                      <button className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors">
                        <ChatBubbleLeftIcon className="w-5 h-5" />
                        <span>{detailedPost.commentCount || 0}</span>
                      </button>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => setBookmarked(!bookmarked)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        <BookmarkIcon className={`w-5 h-5 ${bookmarked ? 'fill-green-600 text-green-600' : ''}`} />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                        <ShareIcon className="w-5 h-5" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        <FlagIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Answers ({comments.length})
              </h3>

              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                          {comment.author.photoURL ? (
                            <img 
                              src={comment.author.photoURL} 
                              alt={comment.author.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <UserIcon className="w-5 h-5 text-green-600" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="text-sm font-medium text-gray-900">
                            {comment.author.name}
                          </h4>
                          {comment.isExpert && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              Expert
                            </span>
                          )}
                          <span className="text-xs text-gray-500">
                            {comment.author.district}, {comment.author.state}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>

                        <div className="prose max-w-none text-gray-700 mb-3 whitespace-pre-line">
                          {comment.content}
                        </div>

                        <div className="flex items-center space-x-4">
                          <button
                            onClick={() => handleLikeComment(comment.id)}
                            className="flex items-center space-x-1 text-gray-500 hover:text-red-500 transition-colors"
                          >
                            {likedComments.has(comment.id) ? (
                              <HeartSolidIcon className="w-4 h-4 text-red-500" />
                            ) : (
                              <HeartIcon className="w-4 h-4" />
                            )}
                            <span className="text-sm">{comment.likes}</span>
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

              {/* Add Comment Form */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <textarea
                      placeholder="Write your answer..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      rows={3}
                    ></textarea>
                    <div className="flex justify-end mt-2 space-x-2">
                      <button 
                        onClick={() => setNewComment('')}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md text-sm font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={handleAddComment}
                        disabled={!newComment.trim()}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                          newComment.trim()
                            ? 'bg-green-600 text-white hover:bg-green-700'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
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