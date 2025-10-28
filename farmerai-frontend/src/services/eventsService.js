import apiClient from './apiClient';

const eventsService = {
  list: async (params = {}) => {
    const { data } = await apiClient.get('/events', { params });
    // If backend returns a proper events array, pass through
    if (Array.isArray(data?.events)) return data;
    if (Array.isArray(data)) return { events: data, pagination: { current: 1, pages: 1, total: data.length } };
    return { events: [], pagination: { current: 1, pages: 1, total: 0 } };
  },
  categories: async () => {
    const { data } = await apiClient.get('/events/categories');
    return Array.isArray(data?.categories) ? data.categories : (Array.isArray(data) ? data : []);
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/events/${id}`); // if not present, detail can be loaded from list or add endpoint later
    return data;
  },
  host: async (payload) => {
    const { data } = await apiClient.post('/events/host', payload);
    return data;
  },
  rsvp: async (eventId, status = 'going') => {
    const { data } = await apiClient.post(`/events/${eventId}/rsvp`, { status });
    return data;
  },
  changeStatus: async (eventId, status) => {
    const { data } = await apiClient.patch(`/events/${eventId}/status`, { status });
    return data;
  },
  attendees: async (eventId) => {
    const { data } = await apiClient.get(`/events/${eventId}/attendees`);
    return data;
  },
  exportICS: (eventId) => `${apiClient.defaults.baseURL}/events/${eventId}/export/ics`,
  exportCSV: (eventId) => `${apiClient.defaults.baseURL}/events/${eventId}/export/csv`,
  exportPDF: (eventId) => `${apiClient.defaults.baseURL}/events/${eventId}/export/pdf`,
  
  // Enhanced features
  search: async (queryString) => {
    const { data } = await apiClient.get(`/events/search?${queryString}`);
    return data;
  },
  getRecommendations: async (limit = 5) => {
    const { data } = await apiClient.get(`/events/recommendations?limit=${limit}`);
    return data;
  },
  getAnalytics: async (eventId) => {
    const { data } = await apiClient.get(`/events/${eventId}/analytics`);
    return data;
  },
  toggleLike: async (eventId) => {
    const { data } = await apiClient.post(`/events/${eventId}/like`);
    return data;
  },
  addComment: async (eventId, text) => {
    const { data } = await apiClient.post(`/events/${eventId}/comment`, { text });
    return data;
  },
  rateEvent: async (eventId, rating) => {
    const { data } = await apiClient.post(`/events/${eventId}/rate`, { rating });
    return data;
  },
  trackView: async (eventId) => {
    const { data } = await apiClient.post(`/events/${eventId}/view`);
    return data;
  },
  getAdminNotifications: async () => {
    const { data } = await apiClient.get('/events/admin/notifications');
    return data;
  },
};

export default eventsService;





