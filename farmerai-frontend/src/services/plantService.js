// src/services/plantService.js
import apiClient from './apiClient';

export const uploadPlantImage = async (file) => {
  const form = new FormData();
  form.append('plantImage', file);
  // Let the browser set the Content-Type with proper multipart boundary
  const { data } = await apiClient.post('/plants/upload', form);
  return data;
};

export const fetchPlants = async () => {
  const { data } = await apiClient.get('/plants');
  return data;
};

export const classifyPlant = async (file) => {
  const form = new FormData();
  form.append('plantImage', file);
  const { data } = await apiClient.post('/plants/classify', form);
  return data;
};

// already there

export const updatePlant = async (id, payload) => {
  const { data } = await apiClient.put(`/plants/${id}`, payload);
  return data;
};

export const deletePlant = async (id) => {
  const { data } = await apiClient.delete(`/plants/${id}`);
  return data;
};

// Create a plant document
// POST /api/plants
export const createPlant = async (payload) => {
  const { data } = await apiClient.post('/plants', payload);
  return data;
};

// Fetch enriched details by plant name (no persistence)
export const fetchPlantDetailsByName = async (name) => {
  const { data } = await apiClient.get('/plants/details', { params: { name } });
  return data;
};