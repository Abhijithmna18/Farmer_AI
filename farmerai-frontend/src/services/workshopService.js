// src/services/workshopService.js
import apiClient from './apiClient';

export const workshopService = {
  // Get all workshops
  getAllWorkshops: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/workshops', { params });
      return data;
    } catch (error) {
      console.error('Error fetching workshops:', error);
      throw error;
    }
  },

  // Get workshop by ID
  getWorkshopById: async (id) => {
    try {
      const { data } = await apiClient.get(`/workshops/${id}`);
      return data;
    } catch (error) {
      console.error('Error fetching workshop:', error);
      throw error;
    }
  },

  // Check if user has access to a workshop
  checkWorkshopAccess: async (workshopId) => {
    try {
      const { data } = await apiClient.get(`/workshops/${workshopId}/access`);
      return data;
    } catch (error) {
      console.error('Error checking workshop access:', error);
      throw error;
    }
  },

  // Create subscription order
  createSubscriptionOrder: async (subscriptionData) => {
    try {
      console.log('Sending subscription order request:', subscriptionData);
      const response = await apiClient.post('/workshops/subscription/order', subscriptionData);
      console.log('Received subscription order response:', response);
      // Check if response has data property
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      return response.data;
    } catch (error) {
      console.error('Error creating subscription order:', error);
      if (error.response) {
        console.error('Error response:', error.response);
        // Return a more structured error
        const errorData = {
          status: error.response.status,
          data: error.response.data,
          message: error.response.data?.message || error.message
        };
        throw errorData;
      } else if (error.request) {
        console.error('Error request:', error.request);
        throw new Error('No response received from server. Please check your internet connection.');
      } else {
        console.error('Error message:', error.message);
        throw new Error('Request failed: ' + error.message);
      }
    }
  },

  // Verify subscription payment
  verifySubscriptionPayment: async (paymentData) => {
    try {
      const { data } = await apiClient.post('/workshops/subscription/verify', paymentData);
      return data;
    } catch (error) {
      console.error('Error verifying subscription payment:', error);
      throw error;
    }
  },

  // Get user's subscriptions
  getUserSubscriptions: async () => {
    try {
      const { data } = await apiClient.get('/workshops/subscriptions');
      return data;
    } catch (error) {
      console.error('Error fetching user subscriptions:', error);
      throw error;
    }
  }
};

export default workshopService;