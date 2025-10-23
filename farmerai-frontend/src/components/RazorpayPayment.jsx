// src/components/RazorpayPayment.jsx
// React component for Razorpay payment integration

import React, { useState } from 'react';
import { CurrencyRupeeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import razorpayService from '../services/razorpay.service';

const RazorpayPayment = ({ 
  bookingId, 
  amount, 
  onPaymentSuccess, 
  onPaymentError,
  onClose 
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // 'processing', 'success', 'error'

  const handlePayment = async () => {
    setLoading(true);
    setPaymentStatus('processing');

    try {
      await razorpayService.processPayment(
        bookingId,
        amount,
        // Success callback
        (response) => {
          console.log('Payment successful:', response);
          setPaymentStatus('success');
          setTimeout(() => {
            onPaymentSuccess(response);
          }, 2000);
        },
        // Error callback
        (error) => {
          console.error('Payment failed:', error);
          setPaymentStatus('error');
          setTimeout(() => {
            onPaymentError(error);
          }, 2000);
        }
      );
    } catch (error) {
      console.error('Payment error:', error);
      setPaymentStatus('error');
      onPaymentError(error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'success':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <CurrencyRupeeIcon className="h-8 w-8 text-blue-500" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing payment...';
      case 'success':
        return 'Payment successful!';
      case 'error':
        return 'Payment failed. Please try again.';
      default:
        return `Pay ₹${amount} to complete your booking`;
    }
  };

  const getButtonText = () => {
    if (loading) return 'Processing...';
    if (paymentStatus === 'success') return 'Payment Successful';
    if (paymentStatus === 'error') return 'Retry Payment';
    return `Pay ₹${amount}`;
  };

  const isButtonDisabled = () => {
    return loading || paymentStatus === 'success';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <div className="text-center">
        {/* Status Icon */}
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>

        {/* Status Message */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {getStatusMessage()}
        </h3>

        {/* Amount Display */}
        {paymentStatus !== 'success' && (
          <div className="text-2xl font-bold text-gray-900 mb-4">
            ₹{amount}
          </div>
        )}

        {/* Payment Button */}
        <div className="space-y-3">
          <button
            onClick={handlePayment}
            disabled={isButtonDisabled()}
            className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
              paymentStatus === 'success'
                ? 'bg-green-100 text-green-800 cursor-not-allowed'
                : paymentStatus === 'error'
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            } ${isButtonDisabled() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {getButtonText()}
          </button>

          {/* Cancel Button */}
          {paymentStatus !== 'success' && (
            <button
              onClick={onClose}
              className="w-full px-6 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          )}
        </div>

        {/* Payment Info */}
        <div className="mt-4 text-xs text-gray-500">
          <p>Secure payment powered by Razorpay</p>
          <p>Booking ID: {bookingId}</p>
        </div>
      </div>
    </div>
  );
};

export default RazorpayPayment;

























