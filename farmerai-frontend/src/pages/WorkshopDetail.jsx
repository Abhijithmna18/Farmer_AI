import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import Button from '../components/Button';
import useAuth from '../hooks/useAuth';

const WorkshopDetail = () => {
  const { id } = useParams();
  const nav = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [workshop, setWorkshop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [accessLoading, setAccessLoading] = useState(true);

  useEffect(() => {
    // Check authentication first
    if (!authLoading) {
      if (!user) {
        // User not authenticated, redirect to login
        nav('/login');
        return;
      }
      
      // User is authenticated, proceed with workshop data and access check
      fetchWorkshop();
      checkAccess();
    }
  }, [user, authLoading, id]);

  const fetchWorkshop = async () => {
    try {
      setLoading(true);
      const response = await workshopService.getWorkshopById(id);
      setWorkshop(response.data.data);
    } catch (err) {
      setError('Failed to fetch workshop details');
      console.error('Error fetching workshop:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkAccess = async () => {
    try {
      setAccessLoading(true);
      const response = await workshopService.checkWorkshopAccess(id);
      // Fix: Access the correct response structure
      setHasAccess(response.data.hasAccess);
    } catch (err) {
      console.error('Error checking access:', err);
      // If workshop not found, redirect to workshops page
      if (err.response && err.response.status === 404) {
        setError('Workshop not found');
        nav('/workshops');
      }
    } finally {
      setAccessLoading(false);
    }
  };

  const handleEnroll = async () => {
    try {
      // For premium workshops, create a subscription order
      if (!workshop.isFree) {
        const response = await workshopService.createSubscriptionOrder({
          type: 'workshop',
          workshopId: id
        });
        
        const { orderId, amount, currency } = response.data.data;
        
        // Store subscriptionId for later use
        localStorage.setItem('currentWorkshopSubscriptionId', response.data.data.subscriptionId);
        
        // Initialize Razorpay payment
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: amount,
          currency: currency,
          name: 'FarmerAI Workshop',
          description: workshop.title,
          order_id: orderId,
          handler: async function (response) {
            try {
              console.log('Razorpay payment response:', response);
              
              // Extract subscriptionId from the order creation response
              // This should have been stored when creating the order
              const subscriptionId = localStorage.getItem('currentWorkshopSubscriptionId');
              
              // Verify payment
              const verifyResponse = await workshopService.verifySubscriptionPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                subscriptionId: subscriptionId
              });
              
              console.log('Payment verification response:', verifyResponse);
              
              // Clean up localStorage
              localStorage.removeItem('currentWorkshopSubscriptionId');
              
              // Refresh access status
              await checkAccess();
              
              // Show success message
              alert('Payment successful! You now have access to this workshop.');
            } catch (err) {
              console.error('Error verifying payment:', err);
              alert('Payment verification failed. Please contact support.');
            }
          },
          prefill: {
            name: 'User Name',
            email: 'user@example.com',
          },
          theme: {
            color: '#10B981'
          }
        };
        
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // For free workshops, redirect to video
        nav(`/workshops/${id}/watch`);
      }
    } catch (err) {
      console.error('Error enrolling in workshop:', err);
      alert('Failed to enroll in workshop. Please try again.');
    }
  };

  // Show loading while checking authentication or workshop data
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700">{error}</p>
            <Button onClick={fetchWorkshop} className="mt-4">Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-500">Workshop not found.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => nav(-1)}
          className="flex items-center text-green-600 hover:text-green-700 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Workshops
        </button>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Workshop header */}
          <div className="relative">
            <img
              src={workshop.thumbnail || workshop.youtubeThumbnail || '/default-workshop.png'}
              alt={workshop.title}
              className="w-full h-96 object-cover"
              onError={(e) => {
                // Fallback to default image
                e.target.src = '/default-workshop.png';
              }}
            />
            {!workshop.isFree && (
              <div className="absolute top-6 right-6 bg-yellow-500 text-white text-sm font-bold px-3 py-1 rounded">
                PREMIUM
              </div>
            )}
          </div>

          <div className="p-8">
            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                {workshop.category}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                {workshop.level}
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                {workshop.duration} min
              </span>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">{workshop.title}</h1>
            <p className="text-gray-600 text-lg mb-8">{workshop.description}</p>

            {/* Instructor */}
            <div className="flex items-center mb-8 p-4 bg-gray-50 rounded-lg">
              <img
                src={workshop.instructor.avatar || '/default-avatar.png'}
                alt={workshop.instructor.name}
                className="w-16 h-16 rounded-full mr-4"
                onError={(e) => {
                  e.target.src = '/default-avatar.png';
                }}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{workshop.instructor.name}</h3>
                {workshop.instructor.bio && (
                  <p className="text-gray-600">{workshop.instructor.bio}</p>
                )}
              </div>
            </div>

            {/* Learning outcomes */}
            {workshop.learningOutcomes && workshop.learningOutcomes.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">What you'll learn</h2>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {workshop.learningOutcomes.map((outcome, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-700">{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Prerequisites */}
            {workshop.prerequisites && workshop.prerequisites.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Prerequisites</h2>
                <ul className="space-y-2">
                  {workshop.prerequisites.map((prereq, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-yellow-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-gray-700">{prereq}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Materials */}
            {workshop.materials && workshop.materials.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Materials Needed</h2>
                <ul className="space-y-2">
                  {workshop.materials.map((material, index) => (
                    <li key={index} className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002 2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <div>
                        <span className="text-gray-700 font-medium">{material.name}</span>
                        {material.description && (
                          <span className="text-gray-600 block text-sm">- {material.description}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action button */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-6 border-t border-gray-200">
              <div className="mb-4 sm:mb-0">
                {workshop.isFree ? (
                  <p className="text-lg font-semibold text-gray-900">Free Workshop</p>
                ) : (
                  <p className="text-2xl font-bold text-gray-900">₹{workshop.price}</p>
                )}
              </div>
              
              {accessLoading ? (
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              ) : hasAccess ? (
                <Button
                  onClick={() => {
                    if (workshop.videoUrl) {
                      // If workshop has a video URL, redirect directly to YouTube/video
                      window.location.href = workshop.videoUrl;
                    } else {
                      // Navigate to workshop watch page for workshops without video URL
                      nav(`/workshops/${id}/watch`);
                    }
                  }}
                  className="px-8 py-3"
                >
                  Watch Now
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    if (workshop.videoUrl) {
                      // If workshop has a video URL, redirect directly to YouTube/video
                      window.location.href = workshop.videoUrl;
                    } else {
                      // Handle enrollment for workshops without video URL
                      handleEnroll();
                    }
                  }}
                  className="px-8 py-3"
                >
                  {workshop.isFree ? 'Watch Free' : `Enroll for ₹${workshop.price}`}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkshopDetail;