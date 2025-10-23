import apiClient from './apiClient';

export const generateRecommendations = async (payload) => {
  const { data } = await apiClient.post('/recommendations/generate', payload);
  return data;
};

export const getRecommendations = async (userId) => {
  const { data } = await apiClient.get(`/recommendations/${userId || ''}`);
  return data;
};

export const getSoilRecommendations = async ({ N, P, K, rainfall, humidity }) => {
  const { data } = await apiClient.post('/recommendations/soil', { N, P, K, rainfall, humidity });
  return data;
};

export const getSoilHistory = async () => {
  const { data } = await apiClient.get('/recommendations/soil/history');
  return data;
};

export const deleteSoilRecommendation = async (id) => {
  const { data } = await apiClient.delete(`/recommendations/soil/${id}`);
  return data;
};

export const updateSoilRecommendation = async (id, payload) => {
  const { data } = await apiClient.put(`/recommendations/soil/${id}`, payload);
  return data;
};

const recommendationService = { generateRecommendations, getRecommendations, getSoilRecommendations, getSoilHistory, deleteSoilRecommendation, updateSoilRecommendation };
export default recommendationService;

// Favorites service
export const listFavorites = async () => {
  const { data } = await apiClient.get('/favorites');
  return data;
};

export const toggleFavorite = async ({ crop, meta, source }) => {
  const { data } = await apiClient.post('/favorites/toggle', { crop, meta, source });
  return data;
};