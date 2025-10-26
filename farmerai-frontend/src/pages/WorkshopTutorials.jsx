import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import Button from '../components/Button';
import useAuth from '../hooks/useAuth';

const WorkshopTutorials = () => {
  const nav = useNavigate();
  const { user, loading: authLoading, refreshSubscriptionStatus } = useAuth();
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [subscriptionChecked, setSubscriptionChecked] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Check if user has an active subscription
  const hasActiveSubscription = user && user.hasActiveSubscription;

  const fetchWorkshops = useCallback(async () => {
    try {
      setLoading(true);
      const response = await workshopService.getAllWorkshops();
      // Extract the data array from the response
      setWorkshops(response.data || []);
    } catch (err) {
      setError('Failed to fetch workshops');
      console.error('Error fetching workshops:', err);
      // Set workshops to empty array on error to prevent undefined issues
      setWorkshops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSubscriptionAndFetchWorkshops = useCallback(async () => {
    if (initialized) return; // Prevent multiple calls
    
    try {
      setInitialized(true);
      // Refresh subscription status to get latest data
      await refreshSubscriptionStatus();
      setSubscriptionChecked(true);
      
      // Fetch workshops after subscription check
      await fetchWorkshops();
    } catch (err) {
      console.error('Error checking subscription status:', err);
      // Still fetch workshops even if subscription check fails
      await fetchWorkshops();
    }
  }, [refreshSubscriptionStatus, fetchWorkshops, initialized]);

  useEffect(() => {
    // Check authentication first
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        nav('/login');
        return;
      }
      
      // User is authenticated, check subscription status and fetch workshops
      checkSubscriptionAndFetchWorkshops();
    }
  }, [user, authLoading, checkSubscriptionAndFetchWorkshops]);

  const filteredWorkshops = (workshops || []).filter(workshop => {
    if (activeTab === 'all') return true;
    if (activeTab === 'free') return workshop.isFree;
    if (activeTab === 'premium') return !workshop.isFree;
    return true;
  });

  const formatDuration = (minutes) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Show loading while checking authentication or subscription
  if (authLoading || loading || !subscriptionChecked) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Workshop Tutorials</h1>
            <p className="text-gray-600">Learn farming techniques with our expert-led workshops</p>
          </div>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Workshop Tutorials</h1>
            <p className="text-gray-600">Learn farming techniques with our expert-led workshops</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchWorkshops} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Workshop Tutorials</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Learn farming techniques with our expert-led workshops. Access free tutorials or subscribe for premium content.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'all'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              All Workshops
            </button>
            <button
              onClick={() => setActiveTab('free')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'free'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Free Tutorials
            </button>
            <button
              onClick={() => setActiveTab('premium')}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                activeTab === 'premium'
                  ? 'bg-green-500 text-white'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Premium Content
            </button>
          </div>
        </div>

        {/* Workshop Grid */}
        {filteredWorkshops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No workshops found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredWorkshops.map((workshop) => (
              <div
                key={workshop._id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                <div className="relative">
                  <img
                    src={workshop.thumbnail || workshop.youtubeThumbnail || '/default-workshop.png'}
                    alt={workshop.title}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      // Fallback to default image
                      e.target.src = '/default-workshop.png';
                    }}
                  />
                  {!workshop.isFree && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded">
                      PREMIUM
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-sm px-2 py-1 rounded">
                    {formatDuration(workshop.duration)}
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-2">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {workshop.category}
                    </span>
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {workshop.level}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{workshop.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {workshop.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={workshop.instructor.avatar || '/default-avatar.png'}
                        alt={workshop.instructor.name}
                        className="w-8 h-8 rounded-full mr-2"
                        onError={(e) => {
                          e.target.src = '/default-avatar.png';
                        }}
                      />
                      <span className="text-sm text-gray-700">{workshop.instructor.name}</span>
                    </div>
                    <Button
                      onClick={() => {
                        if (workshop.videoUrl) {
                          // If workshop has a video URL, redirect directly to YouTube/video
                          window.location.href = workshop.videoUrl;
                        } else if (workshop.isFree) {
                          // For free workshops without video URL, navigate to watch page
                          nav(`/workshops/${workshop._id}/watch`);
                        } else if (hasActiveSubscription) {
                          // For subscribed users, navigate to watch page
                          nav(`/workshops/${workshop._id}/watch`);
                        } else {
                          // For non-subscribed users, navigate to workshop detail page for payment
                          nav(`/workshops/${workshop._id}`);
                        }
                      }}
                      variant={workshop.isFree ? 'primary' : 'accent'}
                      className="text-sm"
                    >
                      {workshop.isFree 
                        ? 'Watch Free' 
                        : hasActiveSubscription 
                          ? 'Watch Now' 
                          : `₹${workshop.price}`}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Subscription CTA - Only show for non-subscribed users */}
        {!hasActiveSubscription && (
          <div className="mt-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-4">Get Unlimited Access to Premium Content</h2>
            <p className="mb-6 max-w-2xl mx-auto">
              Subscribe to our monthly or yearly plan and get access to all premium workshops, 
              exclusive content, and expert support.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button
                onClick={() => nav('/subscription/monthly')}
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Monthly Plan - ₹499/month
              </Button>
              <Button
                onClick={() => nav('/subscription/yearly')}
                variant="secondary"
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Yearly Plan - ₹4999/year (Save 20%)
              </Button>
            </div>
          </div>
        )}

        {/* Subscription Confirmation - Only show for subscribed users */}
        {hasActiveSubscription && (
          <div className="mt-16 bg-gradient-to-r from-green-100 to-blue-100 rounded-2xl p-8 text-center border border-green-200">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">You're a Premium Member!</h2>
            <p className="text-gray-700 mb-4">
              Enjoy unlimited access to all workshops. Start learning now!
            </p>
            <Button
              onClick={() => nav('/subscription/manage')}
              variant="primary"
              className="bg-green-600 hover:bg-green-700"
            >
              Manage Subscription
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkshopTutorials;