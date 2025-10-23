import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, 
  Plus, 
  List, 
  Send,
  CheckCircle
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Section from '../components/Section';
import HomeButton from '../components/HomeButton';
import FeedbackForm from '../components/feedback/FeedbackForm';
import FeedbackList from '../components/feedback/FeedbackList';
import FeedbackDetails from '../components/feedback/FeedbackDetails';

export default function Feedback() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const handleViewDetails = (feedback) => {
    setSelectedFeedback(feedback);
    setShowDetails(true);
  };

  const handleFormSuccess = (feedback) => {
    setActiveTab('list');
    // The FeedbackList component will refresh automatically
  };

  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedFeedback(null);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <HomeButton />
      <PageHeader
        title="Feedback Center"
        subtitle="Share your thoughts, report issues, and suggest improvements"
        icon="💬"
      />

      {/* Tabs */}
      <div className="mb-8">
        <div className="bg-white/90 backdrop-blur-xl p-2 rounded-3xl border-2 border-green-100 border-opacity-60 shadow-[0_25px_60px_-15px_rgba(76,175,80,0.18)]">
          <div className="flex space-x-2">
            {[
              { id: 'list', label: 'My Feedback', icon: List },
              { id: 'submit', label: 'Submit New', icon: Plus }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-3 rounded-2xl transition ${
                  activeTab === tab.id
                    ? 'bg-green-600 text-white'
                    : 'text-gray-600 hover:bg-green-50'
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span>{tab.label}</span>
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
      </Section>

      {/* Feedback Details Modal */}
      {showDetails && selectedFeedback && (
        <FeedbackDetails 
          feedback={selectedFeedback} 
          onClose={handleCloseDetails} 
        />
      )}
    </div>
  );
}



