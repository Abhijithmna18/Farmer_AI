// src/services/searchService.js
import apiClient from './apiClient';

export async function searchAll(q, signal) {
  const { data } = await apiClient.get('/search', { params: { q }, signal });
  return data;
}