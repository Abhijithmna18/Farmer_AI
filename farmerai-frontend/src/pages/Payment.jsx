import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, CreditCardIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { gsap } from 'gsap';
import apiClient from '../services/apiClient';
import { toast } from 'react-hot-toast';
import { loadRazorpayScript, createRazorpayOrder, verifyPayment } from '../config/razorpay';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';

const Payment = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth(); // Get user and loading state from AuthContext
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed

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
      
      // Ensure we have a valid token
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', freshToken);
          console.log('✅ Token refreshed for booking fetch');
        } catch (tokenError) {
          console.error('❌ Failed to refresh token:', tokenError);
        }
      }
      
      const response = await apiClient.get(`/warehouse-bookings/${bookingId}`);
      
      if (response.data.success) {
        setBooking(response.data.data);
      } else {
        throw new Error(response.data.message || 'Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication failed. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to fetch booking details');
        navigate('/warehouses');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    try {
      setProcessing(true);
      setPaymentStatus('processing');

      // Check authentication - verify either user context OR token exists
      const token = localStorage.getItem('token');
      
      if (!user && !token) {
        console.error('❌ No authenticated user found');
        toast.error('Please login to continue with payment');
        navigate('/login');
        return;
      }

      console.log('🔄 Verifying authentication before payment...');
      console.log('User from context:', user ? 'Present' : 'Null');
      console.log('Token in localStorage:', token ? 'Present' : 'Null');
      
      const currentUser = auth.currentUser;
      
      // If Firebase user exists, refresh Firebase token
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true); // Force refresh
          localStorage.setItem('token', freshToken);
          console.log('✅ Firebase token refreshed successfully');
        } catch (tokenError) {
          console.error('❌ Failed to refresh Firebase token:', tokenError);
          toast.error('Authentication error. Please login again.');
          navigate('/login');
          return;
        }
      } else if (token) {
        // For JWT-based auth, token already exists
        console.log('✅ Using existing JWT token for payment');
      } else {
        // No auth method available
        console.error('❌ No authentication method available');
        toast.error('Please login to continue with payment');
        navigate('/login');
        return;
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
                      <span className="text-green-600">{formatCurrency(booking.pricing.totalAmount)}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Button */}
                <button
                  onClick={handlePayment}
                  disabled={processing || paymentStatus === 'success'}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {processing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : paymentStatus === 'success' ? (
                    <>
                      <CheckCircleIcon className="h-5 w-5 mr-2" />
                      Payment Successful
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
