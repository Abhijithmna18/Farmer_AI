import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  List, 
  Send,
  CheckCircle,
  BarChart3,
  TrendingUp,
  Clock,
  AlertCircle,
  Star,
  Filter,
  Search,
  Download,
  Bell,
  Settings
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import HomeButton from '../components/HomeButton';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackDetails from '../components/feedback/FeedbackDetails';
import FeedbackAnalytics from '../components/feedback/FeedbackAnalytics';
import FeedbackNotifications from '../components/feedback/FeedbackNotifications';
import apiClient from '../services/apiClient';

export default function Feedback() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load analytics data
  useEffect(() => {
    loadAnalytics();
    loadNotifications();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await apiClient.get('/feedback/analytics');
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await apiClient.get('/feedback/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetails(true);
  };

  const handleFormSuccess = (feedback) => {
    setActiveTab('list');
    loadAnalytics(); // Refresh analytics after new feedback
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedFeedback(null);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'analytics') {
      loadAnalytics();
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      <PageHeader
        title="Feedback Center"
        subtitle="Share your thoughts, report issues, and suggest improvements"
        icon="💬"
      />

      {/* Enhanced Header with Notifications */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Feedback Center</h1>
              <p className="text-gray-600 mt-1">Share your thoughts, report issues, and suggest improvements</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Notifications */}
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors"
            >
              <Bell className="w-6 h-6" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </button>
            
            {/* Settings */}
            <button className="p-3 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-xl transition-colors">
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Enhanced Tabs */}
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'list', label: 'My Feedback', icon: List, count: analytics?.totalFeedback || 0 },
              { id: 'submit', label: 'Submit New', icon: Plus },
              { id: 'analytics', label: 'Analytics', icon: BarChart3 },
              { id: 'trends', label: 'Trends', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white shadow-lg'
                    : 'text-gray-600 hover:bg-green-50 hover:text-green-700'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    activeTab === tab.id 
                      ? 'bg-white/20 text-white' 
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <Section className="space-y-6">
        {activeTab === 'list' && (
          <FeedbackList 
            onViewDetails={handleViewDetails}
            onSwitchToSubmit={() => setActiveTab('submit')}
          />
        )}
        
        {activeTab === 'submit' && (
          <FeedbackForm 
            onSuccess={handleFormSuccess}
            onCancel={() => setActiveTab('list')}
          />
        )}

        {activeTab === 'analytics' && (
          <FeedbackAnalytics 
            analytics={analytics}
            loading={loading}
          />
        )}

        {activeTab === 'trends' && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border-2 border-gray-100 p-8 text-center">
              <TrendingUp className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Feedback Trends</h3>
              <p className="text-gray-600 mb-6">Track feedback patterns and improvement trends over time</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+15%</div>
                  <div className="text-sm text-blue-800">Response Rate</div>
                </div>
                <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-6">
                  <div className="text-3xl font-bold text-green-600 mb-2">2.3 days</div>
                  <div className="text-sm text-green-800">Avg Response Time</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-6">
                  <div className="text-3xl font-bold text-purple-600 mb-2">94%</div>
                  <div className="text-sm text-purple-800">Satisfaction Rate</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* Feedback Details Modal */}
      {showDetails && selectedFeedback && (
        <FeedbackDetails 
          feedback={selectedFeedback} 
          onClose={handleCloseDetails} 
        />
      )}

      {/* Notifications Modal */}
      {showNotifications && (
        <FeedbackNotifications 
          notifications={notifications}
          onClose={() => setShowNotifications(false)}
          onMarkAsRead={(id) => {
            setNotifications(prev => 
              prev.map(n => n.id === id ? { ...n, read: true } : n)
            );
          }}
        />
      )}
    </div>
  );
}



