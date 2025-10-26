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
      
      // Handle different response structures
      if (!response || !response.data) {
        console.error('Invalid response structure:', response);
        throw new Error('Invalid response from server');
      }
      
      // Return the full response to maintain consistency with axios response structure
      return response;
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
      console.log('Sending payment verification request:', paymentData);
      const response = await apiClient.post('/workshops/subscription/verify', paymentData);
      console.log('Payment verification response:', response);
      return response.data;
    } catch (error) {
      console.error('Error verifying subscription payment:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
      }
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
  },

  // Admin CRUD operations
  createWorkshop: async (workshopData) => {
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(workshopData).forEach(key => {
        if (key !== 'thumbnail' && workshopData[key] !== null && workshopData[key] !== undefined) {
          if (Array.isArray(workshopData[key])) {
            formData.append(key, workshopData[key].join(','));
          } else {
            formData.append(key, workshopData[key]);
          }
        }
      });
      
      // Append thumbnail file if provided
      if (workshopData.thumbnail) {
        formData.append('thumbnail', workshopData.thumbnail);
      }
      
      const { data } = await apiClient.post('/workshops', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      console.error('Error creating workshop:', error);
      throw error;
    }
  },

  updateWorkshop: async (id, workshopData) => {
    try {
      const formData = new FormData();
      
      // Append all text fields
      Object.keys(workshopData).forEach(key => {
        if (key !== 'thumbnail' && workshopData[key] !== null && workshopData[key] !== undefined) {
          if (Array.isArray(workshopData[key])) {
            formData.append(key, workshopData[key].join(','));
          } else {
            formData.append(key, workshopData[key]);
          }
        }
      });
      
      // Append thumbnail file if provided
      if (workshopData.thumbnail) {
        formData.append('thumbnail', workshopData.thumbnail);
      }
      
      const { data } = await apiClient.put(`/workshops/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return data;
    } catch (error) {
      console.error('Error updating workshop:', error);
      throw error;
    }
  },

  deleteWorkshop: async (id) => {
    try {
      const { data } = await apiClient.delete(`/workshops/${id}`);
      return data;
    } catch (error) {
      console.error('Error deleting workshop:', error);
      throw error;
    }
  }
};

export default workshopService;