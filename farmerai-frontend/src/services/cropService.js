import apiClient from './apiClient';

export async function getRecommendation(payload) {
  const { data } = await apiClient.post('/crops/recommend', payload);
  return data;
}










