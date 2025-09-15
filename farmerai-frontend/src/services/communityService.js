import apiClient from './apiClient';

// Posts
export const getApprovedPosts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/posts?${queryParams}`);
  return response.data;
};

export const getMyPosts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/posts/my-posts?${queryParams}`);
  return response.data;
};

export const getPostById = async (id) => {
  const response = await apiClient.get(`/community/posts/${id}`);
  return response.data;
};

export const createPost = async (postData) => {
  const response = await apiClient.post('/community/posts', postData);
  return response.data;
};

export const updatePost = async (id, postData) => {
  const response = await apiClient.put(`/community/posts/${id}`, postData);
  return response.data;
};

export const deletePost = async (id) => {
  const response = await apiClient.delete(`/community/posts/${id}`);
  return response.data;
};

// Comments
export const getPostComments = async (postId, params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/posts/${postId}/comments?${queryParams}`);
  return response.data;
};

export const getMyComments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/comments/my-comments?${queryParams}`);
  return response.data;
};

export const createComment = async (postId, commentData) => {
  const response = await apiClient.post(`/community/posts/${postId}/comments`, commentData);
  return response.data;
};

export const updateComment = async (id, commentData) => {
  const response = await apiClient.put(`/community/comments/${id}`, commentData);
  return response.data;
};

export const deleteComment = async (id) => {
  const response = await apiClient.delete(`/community/comments/${id}`);
  return response.data;
};

// Events
export const getApprovedEvents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/events?${queryParams}`);
  return response.data;
};

export const getMyEvents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/events/my-events?${queryParams}`);
  return response.data;
};

export const getEventById = async (id) => {
  const response = await apiClient.get(`/community/events/${id}`);
  return response.data;
};

export const createEvent = async (eventData) => {
  const response = await apiClient.post('/community/events', eventData);
  return response.data;
};

export const updateEvent = async (id, eventData) => {
  const response = await apiClient.put(`/community/events/${id}`, eventData);
  return response.data;
};

export const deleteEvent = async (id) => {
  const response = await apiClient.delete(`/community/events/${id}`);
  return response.data;
};

export const registerForEvent = async (id) => {
  const response = await apiClient.post(`/community/events/${id}/register`);
  return response.data;
};

export const unregisterFromEvent = async (id) => {
  const response = await apiClient.delete(`/community/events/${id}/unregister`);
  return response.data;
};

// Profiles
export const getApprovedProfiles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/profiles?${queryParams}`);
  return response.data;
};

export const getMyProfile = async () => {
  const response = await apiClient.get('/community/profiles/my-profile');
  return response.data;
};

export const getProfileById = async (id) => {
  const response = await apiClient.get(`/community/profiles/${id}`);
  return response.data;
};

export const createProfile = async (profileData) => {
  const response = await apiClient.post('/community/profiles', profileData);
  return response.data;
};

export const updateProfile = async (id, profileData) => {
  const response = await apiClient.put(`/community/profiles/${id}`, profileData);
  return response.data;
};

// Voting
export const upvotePost = async (id) => {
  const response = await apiClient.post(`/community/posts/${id}/upvote`);
  return response.data;
};

export const downvotePost = async (id) => {
  const response = await apiClient.post(`/community/posts/${id}/downvote`);
  return response.data;
};

export const upvoteComment = async (id) => {
  const response = await apiClient.post(`/community/comments/${id}/upvote`);
  return response.data;
};

export const downvoteComment = async (id) => {
  const response = await apiClient.post(`/community/comments/${id}/downvote`);
  return response.data;
};

// Search
export const searchContent = async (query, type = null) => {
  const params = new URLSearchParams();
  params.append('q', query);
  if (type) params.append('type', type);
  
  const response = await apiClient.get(`/community/search?${params}`);
  return response.data;
};

// Reports
export const createReport = async (reportData) => {
  const response = await apiClient.post('/community/reports', reportData);
  return response.data;
};

// Admin functions
export const getPendingPosts = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/posts/pending?${queryParams}`);
  return response.data;
};

export const getPendingComments = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/comments/pending?${queryParams}`);
  return response.data;
};

export const getPendingEvents = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/events/pending?${queryParams}`);
  return response.data;
};

export const getPendingProfiles = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/profiles/pending?${queryParams}`);
  return response.data;
};

export const getReports = async (params = {}) => {
  const queryParams = new URLSearchParams();
  Object.keys(params).forEach(key => {
    if (params[key]) queryParams.append(key, params[key]);
  });
  
  const response = await apiClient.get(`/community/reports?${queryParams}`);
  return response.data;
};

export const getAdminDashboard = async () => {
  const response = await apiClient.get('/community/admin/dashboard');
  return response.data;
};

// Admin approval actions
export const approvePost = async (id) => {
  const response = await apiClient.put(`/community/admin/posts/${id}/approve`);
  return response.data;
};

export const rejectPost = async (id, rejectionReason) => {
  const response = await apiClient.put(`/community/admin/posts/${id}/reject`, { rejectionReason });
  return response.data;
};

export const editPost = async (id, editData) => {
  const response = await apiClient.put(`/community/admin/posts/${id}/edit`, editData);
  return response.data;
};

export const approveComment = async (id) => {
  const response = await apiClient.put(`/community/admin/comments/${id}/approve`);
  return response.data;
};

export const rejectComment = async (id, rejectionReason) => {
  const response = await apiClient.put(`/community/admin/comments/${id}/reject`, { rejectionReason });
  return response.data;
};

export const editComment = async (id, editData) => {
  const response = await apiClient.put(`/community/admin/comments/${id}/edit`, editData);
  return response.data;
};

export const approveEvent = async (id) => {
  const response = await apiClient.put(`/community/admin/events/${id}/approve`);
  return response.data;
};

export const rejectEvent = async (id, rejectionReason) => {
  const response = await apiClient.put(`/community/admin/events/${id}/reject`, { rejectionReason });
  return response.data;
};

export const editEvent = async (id, editData) => {
  const response = await apiClient.put(`/community/admin/events/${id}/edit`, editData);
  return response.data;
};

export const approveProfile = async (id) => {
  const response = await apiClient.put(`/community/admin/profiles/${id}/approve`);
  return response.data;
};

export const rejectProfile = async (id, rejectionReason) => {
  const response = await apiClient.put(`/community/admin/profiles/${id}/reject`, { rejectionReason });
  return response.data;
};

export const suspendProfile = async (id, suspensionData) => {
  const response = await apiClient.put(`/community/admin/profiles/${id}/suspend`, suspensionData);
  return response.data;
};
