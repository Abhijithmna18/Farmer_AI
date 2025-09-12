import apiClient from './apiClient';

export const createReminder = async (payload) => {
  try {
    const res = await apiClient.post('/reminders', payload);
    return res.data;
  } catch (err) {
    throw err?.response?.data || err;
  }
};

export default { createReminder };
