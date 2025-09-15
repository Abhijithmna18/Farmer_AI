import React, { useState, useEffect } from 'react';
import { 
  AcademicCapIcon, 
  ChatBubbleLeftIcon as ChatAltIcon, 
  ClockIcon,
  UserIcon,
  StarIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

const ExpertQA = ({ searchQuery }) => {
  const [sessions, setSessions] = useState([]);
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sessions');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Topics', icon: '💬' },
    { id: 'crop-management', label: 'Crop Management', icon: '🌾' },
    { id: 'pest-disease', label: 'Pest & Disease', icon: '🐛' },
    { id: 'soil-health', label: 'Soil Health', icon: '🌱' },
    { id: 'irrigation', label: 'Irrigation', icon: '💧' },
    { id: 'organic-farming', label: 'Organic Farming', icon: '🌿' },
    { id: 'technology', label: 'Technology', icon: '💻' },
    { id: 'market-trends', label: 'Market Trends', icon: '📈' },
    { id: 'government-schemes', label: 'Government Schemes', icon: '🏛️' }
  ];

  useEffect(() => {
    fetchData();
  }, [searchQuery, selectedCategory, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'sessions') {
        await fetchSessions();
      } else {
        await fetchExperts();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    // Mock data for Q&A sessions
    setSessions([
      {
        _id: '1',
        title: 'Organic Pest Control Q&A',
        description: 'Ask questions about natural pest control methods and organic farming practices.',
        expert: {
          name: 'Dr. Rajesh Kumar',
          title: 'Agricultural Scientist',
          photoURL: null,
          rating: 4.9,
          experience: '15 years'
        },
        category: 'organic-farming',
        scheduledDate: '2024-01-20T14:00:00Z',
        duration: 60, // minutes
        status: 'upcoming', // upcoming, live, completed
        participants: 45,
        maxParticipants: 100,
        questions: [
          {
            id: '1',
            question: 'How to control aphids naturally?',
            askedBy: 'Priya Menon',
            answered: true,
            answer: 'Use neem oil spray mixed with water and a few drops of dish soap...',
            answeredAt: '2024-01-15T10:30:00Z'
          },
          {
            id: '2',
            question: 'Best organic fertilizers for vegetables?',
            askedBy: 'Suresh Nair',
            answered: false,
            answer: null,
            askedAt: '2024-01-15T11:15:00Z'
          }
        ]
      },
      {
        _id: '2',
        title: 'Soil Health & Nutrition',
        description: 'Expert advice on soil testing, nutrient management, and soil improvement techniques.',
        expert: {
          name: 'Dr. Priya Menon',
          title: 'Soil Scientist',
          photoURL: null,
          rating: 4.8,
          experience: '12 years'
        },
        category: 'soil-health',
        scheduledDate: '2024-01-22T10:00:00Z',
        duration: 90,
        status: 'upcoming',
        participants: 67,
        maxParticipants: 150,
        questions: []
      },
      {
        _id: '3',
        title: 'Paddy Cultivation Best Practices',
        description: 'Live Q&A session on modern paddy cultivation techniques and yield optimization.',
        expert: {
          name: 'Prof. Suresh Nair',
          title: 'Rice Research Specialist',
          photoURL: null,
          rating: 4.9,
          experience: '20 years'
        },
        category: 'crop-management',
        scheduledDate: '2024-01-18T15:00:00Z',
        duration: 75,
        status: 'completed',
        participants: 89,
        maxParticipants: 100,
        questions: [
          {
            id: '3',
            question: 'When is the best time to transplant paddy?',
            askedBy: 'Rajesh Kumar',
            answered: true,
            answer: 'The ideal time for transplanting paddy is when seedlings are 20-25 days old...',
            answeredAt: '2024-01-18T15:30:00Z'
          }
        ]
      }
    ]);
  };

  const fetchExperts = async () => {
    // Mock data for experts
    setExperts([
      {
        _id: '1',
        name: 'Dr. Rajesh Kumar',
        title: 'Agricultural Scientist',
        specialization: 'Organic Farming & Pest Control',
        photoURL: null,
        rating: 4.9,
        totalSessions: 45,
        totalQuestions: 234,
        experience: '15 years',
        qualifications: ['PhD in Agriculture', 'Certified Organic Farming Expert'],
        bio: 'Specialized in organic farming practices and natural pest control methods.',
        availability: 'Available for Q&A',
        nextSession: '2024-01-20T14:00:00Z'
      },
      {
        _id: '2',
        name: 'Dr. Priya Menon',
        title: 'Soil Scientist',
        specialization: 'Soil Health & Nutrition',
        photoURL: null,
        rating: 4.8,
        totalSessions: 38,
        totalQuestions: 189,
        experience: '12 years',
        qualifications: ['PhD in Soil Science', 'Certified Soil Testing Expert'],
        bio: 'Expert in soil analysis, nutrient management, and sustainable soil practices.',
        availability: 'Available for Q&A',
        nextSession: '2024-01-22T10:00:00Z'
      },
      {
        _id: '3',
        name: 'Prof. Suresh Nair',
        title: 'Rice Research Specialist',
        specialization: 'Paddy Cultivation & Yield Optimization',
        photoURL: null,
        rating: 4.9,
        totalSessions: 52,
        totalQuestions: 312,
        experience: '20 years',
        qualifications: ['PhD in Crop Science', 'Rice Research Institute Fellow'],
        bio: 'Leading expert in paddy cultivation techniques and yield improvement strategies.',
        availability: 'Available for Q&A',
        nextSession: '2024-01-25T16:00:00Z'
      }
    ]);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'live': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const SessionCard = ({ session }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(session.status)}`}>
              {session.status === 'live' && '🔴 '}
              {session.status === 'upcoming' && '⏰ '}
              {session.status === 'completed' && '✅ '}
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">{session.duration} min</span>
          </div>
          
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {session.title}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {session.description}
          </p>
        </div>
      </div>

      {/* Expert Info */}
      <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          {session.expert.photoURL ? (
            <img 
              src={session.expert.photoURL} 
              alt={session.expert.name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <UserIcon className="w-5 h-5 text-green-600" />
          )}
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-gray-900">{session.expert.name}</h4>
          <p className="text-sm text-gray-500">{session.expert.title}</p>
          <div className="flex items-center space-x-2 mt-1">
            <div className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="text-sm text-gray-600">{session.expert.rating}</span>
            </div>
            <span className="text-sm text-gray-400">•</span>
            <span className="text-sm text-gray-600">{session.expert.experience} experience</span>
          </div>
        </div>
      </div>

      {/* Session Details */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-500">
          <ClockIcon className="w-4 h-4 mr-2" />
          <span>{formatDate(session.scheduledDate)}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-500">
          <ChatAltIcon className="w-4 h-4 mr-2" />
          <span>{session.participants}/{session.maxParticipants} participants</span>
        </div>
      </div>

      {/* Questions Preview */}
      {session.questions && session.questions.length > 0 && (
        <div className="mb-4">
          <h5 className="text-sm font-medium text-gray-900 mb-2">Recent Questions:</h5>
          <div className="space-y-2">
            {session.questions.slice(0, 2).map((question) => (
              <div key={question.id} className="text-sm">
                <div className="flex items-start space-x-2">
                  {question.answered ? (
                    <CheckCircleIcon className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  ) : (
                    <QuestionMarkCircleIcon className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <p className="text-gray-700">{question.question}</p>
                    <p className="text-xs text-gray-500 mt-1">by {question.askedBy}</p>
                  </div>
                </div>
              </div>
            ))}
            {session.questions.length > 2 && (
              <p className="text-xs text-gray-500">+{session.questions.length - 2} more questions</p>
            )}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-2">
        <button className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
          {session.status === 'upcoming' ? 'Join Session' : 
           session.status === 'live' ? 'Join Live' : 'View Recording'}
        </button>
        <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors">
          Ask Question
        </button>
      </div>
    </div>
  );

  const ExpertCard = ({ expert }) => (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        {/* Expert Avatar */}
        <div className="flex-shrink-0">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            {expert.photoURL ? (
              <img 
                src={expert.photoURL} 
                alt={expert.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-green-600" />
            )}
          </div>
        </div>

        {/* Expert Info */}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {expert.name}
          </h3>
          
          <p className="text-sm text-gray-600 mb-2">{expert.title}</p>
          
          <p className="text-sm text-gray-700 mb-3">{expert.specialization}</p>

          {/* Qualifications */}
          <div className="mb-3">
            {expert.qualifications.map((qual, index) => (
              <span
                key={index}
                className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full mr-2 mb-1"
              >
                {qual}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
            <div className="flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{expert.rating}</span>
            </div>
            <div className="flex items-center space-x-1">
              <ChatAltIcon className="w-4 h-4" />
              <span>{expert.totalSessions} sessions</span>
            </div>
            <div className="flex items-center space-x-1">
              <QuestionMarkCircleIcon className="w-4 h-4" />
              <span>{expert.totalQuestions} questions</span>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">{expert.bio}</p>

          <div className="flex items-center justify-between">
            <span className="text-sm text-green-600 font-medium">{expert.availability}</span>
            <button className="px-4 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 transition-colors">
              Ask Question
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
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Expert Q&A Sessions</h2>
        <p className="text-gray-600 mt-1">Get expert advice from agricultural specialists and veteran farmers</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('sessions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'sessions'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Q&A Sessions
            </button>
            <button
              onClick={() => setActiveTab('experts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'experts'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Expert Directory
            </button>
          </nav>
        </div>
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
      </div>

      {/* Content */}
      {activeTab === 'sessions' ? (
        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12">
              <AcademicCapIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No sessions found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'No Q&A sessions scheduled.'}
              </p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard key={session._id} session={session} />
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {experts.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No experts found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Try adjusting your search terms.' : 'No experts available.'}
              </p>
            </div>
          ) : (
            experts.map((expert) => (
              <ExpertCard key={expert._id} expert={expert} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertQA;
