import apiClient from './apiClient';

export const fetchAdminAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/admin/analytics${query ? `?${query}` : ''}`);
};

export const fetchAdminReports = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/admin/reports${query ? `?${query}` : ''}`);
};

export const fetchAdminOverview = () => apiClient.get('/admin/stats');

export const fetchAdminUsers = () => apiClient.get('/admin/users');
export const fetchAdminProducts = () => apiClient.get('/admin/products');
export const fetchAdminEvents = () => apiClient.get('/admin/events');
export const fetchAdminMessages = () => apiClient.get('/admin/messages');

// Extended analytics endpoints
export const fetchWarehouseAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/admin/analytics/warehouses${query ? `?${query}` : ''}`);
};

export const fetchBookingAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/admin/analytics/bookings${query ? `?${query}` : ''}`);
};

export const fetchPaymentAnalytics = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/admin/analytics/payments${query ? `?${query}` : ''}`);
};







