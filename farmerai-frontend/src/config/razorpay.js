// src/config/razorpay.js
import apiClient from '../services/apiClient';
export const RAZORPAY_CONFIG = {
  keyId: import.meta.env.VITE_RAZORPAY_KEY_ID,
  currency: 'INR',
  name: 'FarmerAI',
  description: 'Warehouse Booking Payment',
  image: '/favicon.png',
  theme: {
    color: '#10B981'
  }
};

export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const createRazorpayOrder = async (amount, currency = 'INR', bookingId) => {
  try {
    const { data } = await apiClient.post('/razorpay/create-order', {
      amount: amount * 100, // Convert to paise
      currency,
      bookingId
    });
    if (data?.success) return data.data;
    throw new Error(data?.message || 'Failed to create Razorpay order');
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

export const verifyPayment = async (bookingId, razorpay_payment_id, razorpay_signature, razorpay_order_id) => {
  try {
    const { data } = await apiClient.post('/warehouse-bookings/verify-payment', {
      bookingId,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_order_id
    });
    if (data?.success) return data.data;
    throw new Error(data?.message || 'Payment verification failed');
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
};