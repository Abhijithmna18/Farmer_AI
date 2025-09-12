import apiClient from './apiClient';

const soilService = {
  create: async (payload) => {
    const { data } = await apiClient.post('/soil-records', payload);
    return data?.data;
  },
  list: async (params = {}) => {
    const { data } = await apiClient.get('/soil-records', { params });
    return data?.data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/soil-records/${id}`);
    return data?.data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/soil-records/${id}`, payload);
    return data?.data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/soil-records/${id}`);
    return data?.data;
  }
};

export default soilService;
