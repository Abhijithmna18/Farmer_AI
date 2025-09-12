import apiClient from './apiClient';

export const createTask = async (payload) => {
  try {
    const res = await apiClient.post('/tasks', payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || err;
  }
};

export default { createTask };
