import apiClient from './apiClient';

// Fetch crop recommendations based on soil, season, and location
const getRecommendations = async (soilType, season, location) => {
  const response = await apiClient.post('/assistant/recommend', {
    soilType,
    season,
    location,
  });
  return response.data; // { recommendations: [...], interactionId }
};

// Persist selected crop for an interaction
const selectCrop = async (interactionId, selectedCrop) => {
  const response = await apiClient.post('/assistant/select', { interactionId, selectedCrop });
  return response.data; // { message, interaction }
};

// Get cultivation guide for a crop
const getCultivationGuide = async (crop) => {
  const response = await apiClient.get('/assistant/guide', { params: { crop } });
  return response.data; // { crop, guide }
};

// Get raw interactions from backend (array or object)
const getInteractions = async () => {
  const response = await apiClient.get('/assistant/interactions');
  const data = response.data;
  // Normalize: backend may return array or { interactions }
  return Array.isArray(data) ? data : (data?.interactions ?? []);
};

// Helper used by Dashboard: returns { interactions: [...] }
const getInteractionHistory = async () => {
  const interactions = await getInteractions();
  return { interactions };
};

// New: Ask Gemini
const askAssistant = async ({ query, language = 'en', sendReminder }) => {
  const response = await apiClient.post('/assistant/ask', { query, language, sendReminder });
  return response.data; // { success, data: { reply, historyId } }
};

// New: Get assistant history for user
const getAssistantHistory = async (userId) => {
  const response = await apiClient.get(`/assistant/history/${userId}`);
  return response.data; // { success, data: [...] }
};

// New: Get market price trends
const getMarketTrends = async (crops, days = 7) => {
  const params = {};
  if (crops) params.crops = crops;
  if (days) params.days = days;
  const response = await apiClient.get('/assistant/market-trends', { params });
  return response.data; // { success, data: { trends, marketDrivers } }
};

const assistantService = {
  getRecommendations,
  selectCrop,
  getCultivationGuide,
  getInteractions,
  getInteractionHistory,
  askAssistant,
  getAssistantHistory,
  getMarketTrends,
  // Task planner helpers
  async listTasks() {
    const res = await apiClient.get('/assistant/tasks');
    return res.data?.data ?? [];
  },
  async createTask({ title, dueDate }) {
    const res = await apiClient.post('/assistant/tasks', { title, dueDate });
    return res.data?.data;
  },
  async completeTask({ id, completed = true, proTip }) {
    const res = await apiClient.patch(`/assistant/tasks/${id}/complete`, { completed, proTip });
    return res.data?.data;
  },
  async deleteTask(id) {
    const res = await apiClient.delete(`/assistant/tasks/${id}`);
    return !!res.data?.success;
  }
};

export default assistantService;
export { getRecommendations, selectCrop, getCultivationGuide, getInteractions, getInteractionHistory, askAssistant, getAssistantHistory, getMarketTrends };
