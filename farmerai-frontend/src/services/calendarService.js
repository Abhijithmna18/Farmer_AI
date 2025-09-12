import apiClient from './apiClient';

// Use the same base configured in apiClient (baseURL already includes /api)
const API_PATH = '/calendar';

// Existing function (kept): returns all calendars
const getGrowthCalendar = async () => {
  const response = await apiClient.get(API_PATH);
  return response.data;
};

// Calendar CRUD operations
export const createGrowthCalendar = async (calendarData) => {
  try {
    console.log('📅 Creating growth calendar:', calendarData);
    const response = await apiClient.post(API_PATH, calendarData);
    console.log('✅ Growth calendar created successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error creating growth calendar:', error);
    throw error?.response?.data || error;
  }
};

export const getGrowthCalendars = async (filters = {}) => {
  try {
    console.log('📅 Fetching growth calendars with filters:', filters);
    const params = new URLSearchParams();
    if (filters.year) params.append('year', filters.year);
    if (filters.season) params.append('season', filters.season);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive);
    
    const response = await apiClient.get(`${API_PATH}?${params.toString()}`);
    console.log(`✅ Retrieved ${response.data.data?.length || 0} calendars`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching growth calendars:', error);
    throw error?.response?.data || error;
  }
};

export const getGrowthCalendarById = async (id) => {
  try {
    console.log('📅 Fetching calendar by ID:', id);
    const response = await apiClient.get(`${API_PATH}/${id}`);
    console.log('✅ Calendar retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching calendar:', error);
    throw error?.response?.data || error;
  }
};

export const updateGrowthCalendar = async (id, updateData) => {
  try {
    console.log('📅 Updating calendar:', id, updateData);
    const response = await apiClient.patch(`${API_PATH}/${id}`, updateData);
    console.log('✅ Calendar updated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error updating calendar:', error);
    throw error?.response?.data || error;
  }
};

export const deleteGrowthCalendar = async (id) => {
  try {
    console.log('📅 Deleting calendar:', id);
    const response = await apiClient.delete(`${API_PATH}/${id}`);
    console.log('✅ Calendar deleted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting calendar:', error);
    throw error?.response?.data || error;
  }
};

// Crop Events management
export const addCropEvent = async (calendarId, eventData) => {
  try {
    console.log('🌱 Adding crop event to calendar:', calendarId, eventData);
    const response = await apiClient.post(`${API_PATH}/${calendarId}/events`, eventData);
    console.log('✅ Crop event added successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error adding crop event:', error);
    throw error?.response?.data || error;
  }
};

export const updateCropEvent = async (calendarId, eventId, updateData) => {
  try {
    console.log('🌱 Updating crop event:', calendarId, eventId, updateData);
    const response = await apiClient.put(`${API_PATH}/${calendarId}/events/${eventId}`, updateData);
    console.log('✅ Crop event updated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error updating crop event:', error);
    throw error?.response?.data || error;
  }
};

export const deleteCropEvent = async (calendarId, eventId) => {
  try {
    console.log('🌱 Deleting crop event:', calendarId, eventId);
    const response = await apiClient.delete(`${API_PATH}/${calendarId}/events/${eventId}`);
    console.log('✅ Crop event deleted successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error deleting crop event:', error);
    throw error?.response?.data || error;
  }
};

// Analytics and insights
export const getCalendarAnalytics = async (calendarId) => {
  try {
    console.log('📊 Fetching calendar analytics:', calendarId);
    const response = await apiClient.get(`${API_PATH}/${calendarId}/analytics`);
    console.log('✅ Analytics retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching analytics:', error);
    throw error?.response?.data || error;
  }
};

// Weather integration
export const getWeatherSuggestions = async (latitude, longitude, activity) => {
  try {
    console.log('🌤️ Getting weather suggestions:', { latitude, longitude, activity });
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      activity
    });
    const response = await apiClient.get(`${API_PATH}/weather/suggestions?${params.toString()}`);
    console.log('✅ Weather suggestions retrieved successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error getting weather suggestions:', error);
    throw error?.response?.data || error;
  }
};

// Export/Import functionality
export const exportCalendar = async (calendarId, format = 'csv') => {
  try {
    console.log('📤 Exporting calendar:', calendarId, format);
    const response = await apiClient.get(`${API_PATH}/${calendarId}/export?format=${format}`, {
      responseType: 'blob'
    });
    console.log('✅ Calendar exported successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error exporting calendar:', error);
    throw error?.response?.data || error;
  }
};

export const importCalendar = async (file, format = 'csv') => {
  try {
    console.log('📥 Importing calendar:', file.name, format);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('format', format);
    
    const response = await apiClient.post(`${API_PATH}/import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    console.log('✅ Calendar imported successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error importing calendar:', error);
    throw error?.response?.data || error;
  }
};

// Dashboard helper: calendars with remaining days and lightweight stats
export const getCalendarsWithRemainingDays = async () => {
  try {
    const response = await apiClient.get(`${API_PATH}/dashboard`);
    const raw = response?.data?.data || [];
    // Map backend fields to what the Dashboard expects
    const mapped = raw.map((item) => ({
      ...item,
      remainingDaysToHarvest: item.remainingDays ?? null,
      // Provide safe fallbacks so UI can render without extra checks
      stageProgress: item.stageProgress ?? 0,
      currentStage: item.currentStage ?? null,
      upcomingTasks: item.upcomingTasks ?? [],
    }));
    return { ...response.data, data: mapped };
  } catch (error) {
    console.error('❌ Error fetching dashboard calendars:', error);
    throw error?.response?.data || error;
  }
};

// Fetch active calendars for a user (sorted by nearest harvest date)
export const getActiveCalendarsByUser = async (userId) => {
  try {
    const response = await apiClient.get(`${API_PATH}/${userId}/active`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching active calendars:', error);
    throw error?.response?.data || error;
  }
};

// Offline sync functionality
export const syncOfflineChanges = async (changes) => {
  try {
    console.log('🔄 Syncing offline changes:', changes.length, 'changes');
    const response = await apiClient.post(`${API_PATH}/sync`, { changes });
    console.log('✅ Offline changes synced successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error syncing offline changes:', error);
    throw error?.response?.data || error;
  }
};

// Collaboration features
export const inviteCollaborator = async (calendarId, email, role = 'viewer') => {
  try {
    console.log('👥 Inviting collaborator:', calendarId, email, role);
    const response = await apiClient.post(`${API_PATH}/${calendarId}/collaborators`, {
      email,
      role
    });
    console.log('✅ Collaborator invited successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error inviting collaborator:', error);
    throw error?.response?.data || error;
  }
};

export const updateCollaboratorRole = async (calendarId, userId, role) => {
  try {
    console.log('👥 Updating collaborator role:', calendarId, userId, role);
    const response = await apiClient.put(`${API_PATH}/${calendarId}/collaborators/${userId}`, {
      role
    });
    console.log('✅ Collaborator role updated successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error updating collaborator role:', error);
    throw error?.response?.data || error;
  }
};

export const removeCollaborator = async (calendarId, userId) => {
  try {
    console.log('👥 Removing collaborator:', calendarId, userId);
    const response = await apiClient.delete(`${API_PATH}/${calendarId}/collaborators/${userId}`);
    console.log('✅ Collaborator removed successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Error removing collaborator:', error);
    throw error?.response?.data || error;
  }
};

// Keep default export for backward compatibility
export default {
  getGrowthCalendar,
};
