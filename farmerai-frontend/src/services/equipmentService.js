import apiClient from './apiClient';

const equipmentService = {
  create: async (payload) => {
    const { data } = await apiClient.post('/equipment', payload);
    return data?.data;
  },
  list: async (params = {}) => {
    const { data } = await apiClient.get('/equipment', { params });
    return data?.data;
  },
  getById: async (id) => {
    const { data } = await apiClient.get(`/equipment/${id}`);
    return data?.data;
  },
  update: async (id, payload) => {
    const { data } = await apiClient.put(`/equipment/${id}`, payload);
    return data?.data;
  },
  remove: async (id) => {
    const { data } = await apiClient.delete(`/equipment/${id}`);
    return data?.data;
  },
  ownerInventory: async (userId) => {
    const { data } = await apiClient.get(`/equipment/owner/${userId}`);
    return data?.data;
  }
};

export default equipmentService;
