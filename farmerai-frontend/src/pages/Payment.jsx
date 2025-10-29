import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, CreditCardIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import { loadRazorpayScript, createRazorpayOrder, verifyPayment } from '../config/razorpay';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { handleAuthError, refreshFirebaseToken, isAuthenticated } from '../utils/authUtils';
import { handleZeroPricing, fixBookingPricing } from '../utils/pricingUtils';
// AuthDebug removed for production UI

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading, refreshToken } = useAuth(); // Get user, loading state, and refreshToken from AuthContext
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [fixingPricing, setFixingPricing] = useState(false);
  const [pricingError, setPricingError] = useState(null);

  useEffect(() => {
    console.log('🔍 Payment component mounted - Auth state:', {
      user: user ? 'Present' : 'Null',
      authLoading,
      token: localStorage.getItem('token') ? 'Present' : 'Null'
    });
    fetchBookingDetails();
  }, [bookingId]);

  useEffect(() => {
    if (booking) {
      gsap.fromTo('.payment-container',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out' }
      );
    }
  }, [booking]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      
      // Try to refresh token using AuthContext if available
      if (refreshToken) {
        try {
          await refreshToken();
          console.log('✅ Token refreshed using AuthContext');
        } catch (tokenError) {
          console.error('❌ Failed to refresh token via AuthContext:', tokenError);
        }
      } else {
        // Fallback to manual token refresh
        await refreshFirebaseToken();
      }
      
      const response = await apiClient.get(`/warehouse-bookings/${bookingId}`);
      
      if (response.data.success) {
        setBooking(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      
      // Use the utility function to handle auth errors
      const wasAuthError = handleAuthError(error, navigate, '/my-bookings', {
        customMessage: 'Your session has expired. Please login again to view your booking.'
      });
      
      if (!wasAuthError) {
        // Handle non-auth errors
        toast.error('Failed to fetch booking details. Please try again.');
        navigate('/my-bookings');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFixPricing = async () => {
    try {
      setFixingPricing(true);
      setPricingError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        toast.error('Please login to fix pricing');
        return;
      }
      
      console.log('🔧 Fixing pricing for booking:', bookingId);
      const result = await fixBookingPricing(bookingId, token);
      
      if (result.success) {
        console.log('✅ Pricing fixed successfully:', result.data);
        setBooking(result.data);
        toast.success('Pricing fixed successfully!');
      } else {
        console.error('❌ Failed to fix pricing:', result.message);
        setPricingError(result.message);
        toast.error(result.message || 'Failed to fix pricing');
      }
    } catch (error) {
      console.error('❌ Error fixing pricing:', error);
      setPricingError(error.message);
      toast.error('Error fixing pricing');
    } finally {
      setFixingPricing(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStatus('processing');

      // Wait for auth loading to complete, but don't block if we have a token
      const hasToken = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (authLoading && !hasToken) {
        console.log('⏳ Waiting for authentication to complete...');
        toast.loading('Verifying authentication...');
        return;
      }

      // Simplified authentication check
      console.log('🔍 Debug authentication check:');
      console.log('- User from context:', user);
      console.log('- Auth loading:', authLoading);
      console.log('- Firebase current user:', auth.currentUser);
      console.log('- Token in localStorage:', localStorage.getItem('token'));
      console.log('- Email in localStorage:', localStorage.getItem('email'));

      // Check if user is authenticated using multiple methods
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const firebaseUser = auth.currentUser;
      const email = localStorage.getItem('email');
      const userFromContext = user;
      
      // User is considered authenticated if ANY of these are true
      const isAuthenticated = !!(token || firebaseUser || email || userFromContext);
      
      console.log('- Authentication check result:', isAuthenticated);
      console.log('- Token exists:', !!token);
      console.log('- Firebase user exists:', !!firebaseUser);
      console.log('- Email exists:', !!email);
      console.log('- User from context exists:', !!userFromContext);

      if (!isAuthenticated) {
        console.error('❌ No authenticated user found');
        console.log('🔍 Available auth data:');
        console.log('  - localStorage token:', localStorage.getItem('token'));
        console.log('  - sessionStorage token:', sessionStorage.getItem('token'));
        console.log('  - localStorage email:', localStorage.getItem('email'));
        console.log('  - Firebase user:', auth.currentUser);
        console.log('  - Auth context user:', user);
        toast.error('Please login to continue with payment');
        navigate('/login', { state: { from: `/payment/${bookingId}` } });
        return;
      }

      console.log('✅ Authentication verified, proceeding with payment...');

      console.log('🔄 Verifying authentication before payment...');
      console.log('User from context:', user ? 'Present' : 'Null');
      console.log('Firebase user:', auth.currentUser ? 'Present' : 'Null');
      
      // Try to refresh token using AuthContext if available
      if (refreshToken) {
        try {
          await refreshToken();
          console.log('✅ Token refreshed using AuthContext');
        } catch (tokenError) {
          console.error('❌ Failed to refresh token via AuthContext:', tokenError);
          // Fallback to manual refresh
          await refreshFirebaseToken();
        }
      } else {
        // Fallback to manual token refresh
        await refreshFirebaseToken();
      }

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create Razorpay order
      const orderData = await createRazorpayOrder(
        booking.pricing.totalAmount,
        'INR',
        booking._id
      );

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: booking.pricing.totalAmount * 100,
        currency: 'INR',
        name: 'FarmerAI',
        description: `Booking for ${booking.warehouse?.name || 'Unknown Warehouse'}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            // Verify payment
            const verificationResult = await verifyPayment(
              booking._id, 
              response.razorpay_payment_id, 
              response.razorpay_signature,
              response.razorpay_order_id
            );
            
            setPaymentStatus('success');
            toast.success('Payment successful! Booking confirmed.');
            
            // Refresh booking data to get updated payment status
            setTimeout(async () => {
              try {
                await fetchBookingDetails();
                // Redirect to my bookings after a short delay to show success message
                setTimeout(() => {
                  navigate('/my-bookings');
                }, 2000);
              } catch (refreshError) {
                console.error('Error refreshing booking data:', refreshError);
                navigate('/my-bookings');
              }
            }, 1000);
          } catch (error) {
            console.error('Payment verification error:', error);
            setPaymentStatus('failed');
            toast.error('Payment verification failed: ' + (error.response?.data?.message || error.message));
          }
        },
        prefill: {
          name: (booking.farmer?.firstName || '') + ' ' + (booking.farmer?.lastName || ''),
          email: booking.farmer?.email || '',
          contact: booking.farmer?.phone || ''
        },
        theme: {
          color: '#10B981'
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('pending');
            setProcessing(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      setPaymentStatus('failed');
      
      // Show more specific error messages
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else if (error.message?.includes('Razorpay script')) {
        toast.error('Failed to load payment gateway. Please check your internet connection.');
      } else {
        toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Wait for both auth and booking to load
  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate('/warehouses')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Browse Warehouses
          </button>
        </div>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Show loading state while authentication is being verified
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Verifying Authentication</h2>
          <p className="text-gray-600">Please wait while we verify your login status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Booking</h1>
            <p className="text-gray-600">Review your booking details and proceed to payment</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Booking Summary */}
            <div className="lg:col-span-2 payment-container">
              <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Booking Summary</h2>
                
                {/* Warehouse Info */}
                <div className="border-b border-gray-200 pb-4 mb-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{booking.warehouse?.name || 'Unknown Warehouse'}</h3>
                  <p className="text-gray-600 mb-2">{booking.warehouse?.location?.address || 'Address not available'}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <span>Capacity: {booking.warehouse?.capacity?.available || 0} {booking.warehouse?.capacity?.unit || ''}</span>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Produce Type:</span>
                    <span className="font-medium">{booking.produce.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{booking.produce.quantity} {booking.produce.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Start Date:</span>
                    <span className="font-medium">{formatDate(booking.bookingDates.startDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">End Date:</span>
                    <span className="font-medium">{formatDate(booking.bookingDates.endDate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{booking.bookingDates.duration} days</span>
                  </div>
                  {booking.notes && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notes:</span>
                      <span className="font-medium">{booking.notes}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Status */}
              {paymentStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-500 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Payment Successful!</h3>
                      <p className="text-green-700">Your booking has been confirmed. You will receive an email confirmation shortly.</p>
                    </div>
                  </div>
                </div>
              )}

              {paymentStatus === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center">
                    <XCircleIcon className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Payment Failed</h3>
                      <p className="text-red-700">There was an error processing your payment. Please try again.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            <div className="lg:col-span-1 payment-container">
              <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Details</h2>
                
                {/* Pricing Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base Price:</span>
                    <span>{formatCurrency(booking.pricing.basePrice)}/day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration:</span>
                    <span>{booking.bookingDates.duration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span>{booking.produce.quantity} {booking.produce.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>{formatCurrency(booking.pricing.basePrice * booking.bookingDates.duration * booking.produce.quantity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform Fee (5%):</span>
                    <span>{formatCurrency(booking.pricing.platformFee)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <div className="flex justify-between text-lg font-semibold">
                      <span>Total Amount:</span>
                      {handleZeroPricing.isZeroPricing(booking.pricing) ? (
                        <div className="flex flex-col items-end">
                          <span className="text-red-600">₹0.00</span>
                          <span className="text-xs text-red-500">Pricing needs to be calculated</span>
                        </div>
                      ) : (
                        <span className="text-green-600">{formatCurrency(booking.pricing.totalAmount)}</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Zero Pricing Fix Button */}
                  {handleZeroPricing.isZeroPricing(booking.pricing) && (
                    <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-orange-800 font-medium">Pricing Issue Detected</p>
                          <p className="text-orange-600 text-sm">The booking pricing needs to be recalculated</p>
                        </div>
                        <button
                          onClick={handleFixPricing}
                          disabled={fixingPricing}
                          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center"
                        >
                          {fixingPricing ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Fixing...
                            </>
                          ) : (
                            'Fix Pricing'
                          )}
                        </button>
                      </div>
                      {pricingError && (
                        <p className="text-red-600 text-sm mt-2">{pricingError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || paymentStatus === 'success' || authLoading || handleZeroPricing.isZeroPricing(booking.pricing)}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : authLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Verifying Authentication...
                    </>
                  ) : paymentStatus === 'success' ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Payment Successful
                    </>
                  ) : handleZeroPricing.isZeroPricing(booking.pricing) ? (
                    <>
                      <XCircleIcon className="h-5 w-5 mr-2" />
                      Fix Pricing First
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5 mr-2" />
                      Pay with Razorpay
                    </>
                  )}
                </button>

                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500">
                    Secure payment powered by Razorpay
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payment;
