import React, { useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { workshopService } from '../services/workshopService';
import Button from '../components/Button';
import { AuthContext } from '../context/AuthContext';

const Subscription = () => {
  const { plan } = useParams();
  const nav = useNavigate();
  const { user, refreshToken } = useContext(AuthContext);

  const plans = {
    monthly: {
      name: 'Monthly Subscription',
      price: 499,
      period: 'month',
      description: 'Get access to all premium workshops for one month',
      features: [
        'Access to all premium workshops',
        'New workshops added monthly',
        'Downloadable resources',
        'Community access',
        'Email support'
      ]
    },
    yearly: {
      name: 'Yearly Subscription',
      price: 4999,
      period: 'year',
      description: 'Get access to all premium workshops for one year (Save 20%)',
      features: [
        'Access to all premium workshops',
        'New workshops added monthly',
        'Downloadable resources',
        'Community access',
        'Priority email support',
        'Exclusive workshops',
        'Early access to new content'
      ]
    }
  };

  const selectedPlan = plans[plan] || plans.monthly;

  const handleSubscribe = async () => {
    try {
      // Check if user is authenticated
      console.log('User authentication status:', user);
      if (!user) {
        alert('You must be logged in to subscribe. Please log in and try again.');
        return;
      }
      
      console.log('Creating subscription order with plan:', plan || 'monthly');
      const response = await workshopService.createSubscriptionOrder({
        type: plan || 'monthly'
      });
      
      console.log('Subscription order response:', response);
      
      // Check if response has the expected structure
      if (!response || !response.data || !response.data.data) {
        console.error('Invalid response structure:', response);
        alert('Failed to create subscription order. Invalid response from server.');
        return;
      }
      
      const { orderId, amount, currency, subscriptionId } = response.data.data;
      
      // Check if all required properties are present
      if (!orderId || !amount || !currency || !subscriptionId) {
        console.error('Missing required properties in response data:', response.data.data);
        alert('Failed to create subscription order. Missing required data from server.');
        return;
      }
      
      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency,
        name: 'FarmerAI Subscription',
        description: selectedPlan.name,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment
            await workshopService.verifySubscriptionPayment({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              subscriptionId: subscriptionId
            });
            
            // Show success message and redirect
            alert('Subscription successful! You now have access to all premium content.');
            nav('/workshops');
          } catch (err) {
            console.error('Error verifying payment:', err);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User',
          email: user.email || 'user@example.com',
        },
        theme: {
          color: '#10B981'
        }
      };
      
      // Check if Razorpay is loaded
      if (!window.Razorpay) {
        console.error('Razorpay script not loaded');
        alert('Payment gateway not loaded. Please refresh the page and try again.');
        return;
      }
      
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error('Error creating subscription order:', err);
      if (err.response) {
        console.error('Response data:', err.response.data);
        console.error('Response status:', err.response.status);
        console.error('Response headers:', err.response.headers);
        
        // Handle specific error cases
        if (err.response.status === 401) {
          alert('Your session has expired. Please log in again.');
          // Optionally redirect to login
          // window.location.href = '/login';
        } else if (err.response.status === 400) {
          alert(`Invalid request: ${err.response.data?.message || err.message}`);
        } else {
          alert(`Failed to create subscription order. Error: ${err.response.data?.message || err.message}`);
        }
      } else if (err.request) {
        // The request was made but no response was received
        console.error('No response received:', err.request);
        alert('Failed to create subscription order. Please check your internet connection and try again.');
      } else {
        // Something else happened
        console.error('Error message:', err.message);
        alert('Failed to create subscription order. Please check your internet connection and try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <button
          onClick={() => nav(-1)}
          className="flex items-center text-green-600 hover:text-green-700 mb-6"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Get unlimited access to our premium farming workshops and expert-led tutorials.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">{selectedPlan.name}</h2>
              <div className="mt-4">
                <span className="text-5xl font-bold text-gray-900">₹{selectedPlan.price}</span>
                <span className="text-gray-600">/{selectedPlan.period}</span>
              </div>
              <p className="mt-2 text-gray-600">{selectedPlan.description}</p>
            </div>

            <ul className="space-y-4 mb-8">
              {selectedPlan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="text-center">
              <Button
                onClick={handleSubscribe}
                variant="accent"
                className="w-full md:w-auto px-8 py-4 text-lg"
              >
                Subscribe Now
              </Button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-gray-600 text-sm">
                By subscribing, you agree to our Terms of Service and Privacy Policy.
                Your subscription will automatically renew unless canceled.
              </p>
            </div>
          </div>
        </div>

        {/* Plan comparison */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          {Object.entries(plans).map(([key, plan]) => (
            <div
              key={key}
              className={`bg-white rounded-xl shadow-md p-6 border-2 ${
                key === selectedPlan ? 'border-green-500' : 'border-gray-200'
              }`}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              <p className="text-gray-600 mb-4">{plan.description}</p>
              <Button
                onClick={() => nav(`/subscription/${key}`)}
                variant={key === selectedPlan ? 'accent' : 'primary'}
                className="w-full"
              >
                {key === selectedPlan ? 'Current Plan' : 'Select Plan'}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Subscription;