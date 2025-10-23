// src/services/adminSettingsService.js
import apiClient from './apiClient';

// Admin Preferences
export const getAdminPreferences = async () => {
  const response = await apiClient.get('/admin/settings/preferences');
  return response.data;
};

export const updateAdminPreferences = async (preferences) => {
  const response = await apiClient.put('/admin/settings/preferences', preferences);
  return response.data;
};

// System Configuration
export const getSystemConfiguration = async () => {
  const response = await apiClient.get('/admin/settings/system');
  return response.data;
};

export const updateSystemConfiguration = async (config) => {
  const response = await apiClient.put('/admin/settings/system', config);
  return response.data;
};

// Environment Configuration
export const getEnvironmentConfiguration = async () => {
  const response = await apiClient.get('/admin/settings/environment');
  return response.data;
};

export const updateEnvironmentConfiguration = async (config) => {
  const response = await apiClient.put('/admin/settings/environment', config);
  return response.data;
};

// Configuration Logs
export const getConfigurationLogs = async () => {
  const response = await apiClient.get('/admin/settings/logs');
  return response.data;
};

// Restore Defaults
export const restoreDefaultConfiguration = async () => {
  const response = await apiClient.post('/admin/settings/restore-defaults');
  return response.data;
};