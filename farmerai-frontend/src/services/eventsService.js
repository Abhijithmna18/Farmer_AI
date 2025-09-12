import apiClient from './apiClient';

const eventsService = {
  list: async (params = {}) => {
    const { data } = await apiClient.get('/events', { params });
    return data;
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
};

export default eventsService;





