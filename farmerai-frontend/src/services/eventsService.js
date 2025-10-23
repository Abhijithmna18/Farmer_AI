import apiClient from './apiClient';

const eventsService = {
  list: async (params = {}) => {
    try {
      const { data } = await apiClient.get('/events', { params });
      // If backend returns a proper events array, pass through
      if (Array.isArray(data?.events)) return data;
      if (Array.isArray(data)) return { events: data, pagination: { current: 1, pages: 1, total: data.length } };
    } catch (_) {
      // fall through to mock
    }
    // Mock dataset (9 items) for UI demo
    const now = Date.now();
    const cats = ['training','market','community'];
    const mk = (i) => ({
      _id: `mock-${i}`,
      title: [`Soil Health Workshop`,`Local Market Meetup`,`Farmer Community Gathering`,`Irrigation Best Practices`,`Organic Farming 101`,`Crop Disease Awareness`,`Warehouse Logistics Talk`,`AgriTech Demo Day`,`Sustainable Practices Seminar`][i%9],
      dateTime: new Date(now + (i-2)*86400000).toISOString(),
      duration: `${90 + (i%3)*30} mins`,
      location: ['Kochi, IN','Chennai, IN','Bengaluru, IN','Delhi, IN'][i%4],
      locationDetail: { address: ['Town Hall','Agri Center','Community Park','Exhibition Ground'][i%4] },
      attendeeCount: 20 + i*5,
      category: cats[i%cats.length],
      tags: ['agri','farming', cats[i%cats.length]],
      bannerUrl: `https://images.unsplash.com/photo-1501004318641-b39e6451bec6?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=Mnwx`,
      description: 'Join us for insights, best practices, and networking with fellow farmers and experts.'
    });
    const list = Array.from({ length: 9 }, (_, i) => mk(i));
    return { events: list, pagination: { current: 1, pages: 1, total: list.length } };
  },
  categories: async () => {
    try {
      const { data } = await apiClient.get('/events/categories');
      return Array.isArray(data?.categories) ? data.categories : (Array.isArray(data) ? data : []);
    } catch {
      // Fallback to mock categories
      return ['training','market','community'];
    }
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
    // Shortcut for mock ids to avoid noisy network errors in console
    if (String(eventId || '').startsWith('mock') || String(eventId || '').startsWith('training-')) {
      try {
        const key = 'rsvpEvents';
        const cur = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        if (status === 'going') cur.add(eventId); else cur.delete(eventId);
        localStorage.setItem(key, JSON.stringify(Array.from(cur)));
      } catch {}
      return { success: true, message: 'RSVP saved (mock)' };
    }
    try {
      const { data } = await apiClient.post(`/events/${eventId}/rsvp`, { status });
      return data;
    } catch (_) {
      // Mock: persist RSVP locally so UI feels responsive
      try {
        const key = 'rsvpEvents';
        const cur = new Set(JSON.parse(localStorage.getItem(key) || '[]'));
        if (status === 'going') cur.add(eventId); else cur.delete(eventId);
        localStorage.setItem(key, JSON.stringify(Array.from(cur)));
      } catch {}
      return { success: true, message: 'RSVP saved (mock)' };
    }
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





