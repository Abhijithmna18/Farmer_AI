import apiClient from "./apiClient";

export const fetchProfile = async () => {
  const { data } = await apiClient.get("/user");
  return data.user || data;
};

export const updateProfile = async (payload) => {
  const { data } = await apiClient.put("/user", payload);
  return data.user || data;
};

export const uploadProfilePicture = async (file) => {
  const form = new FormData();
  form.append('profilePicture', file);
  const { data } = await apiClient.post('/user/profile-picture', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const removeProfilePicture = async () => {
  const { data } = await apiClient.delete('/user/profile-picture');
  return data;
};

// Get user statistics
export const getUserStats = async () => {
  const { data } = await apiClient.get('/user/stats');
  return data;
};

// Get user activity feed
export const getActivityFeed = async (page = 1, limit = 10) => {
  const { data } = await apiClient.get(`/user/activity?page=${page}&limit=${limit}`);
  return data;
};

// Update farmer profile
export const updateFarmerProfile = async (profileData) => {
  const { data } = await apiClient.put('/user/farmer', profileData);
  return data;
};

// Update buyer profile
export const updateBuyerProfile = async (profileData) => {
  const { data } = await apiClient.put('/user/buyer', profileData);
  return data;
};

// Update warehouse owner profile
export const updateWarehouseOwnerProfile = async (profileData) => {
  const { data } = await apiClient.put('/user/warehouse-owner', profileData);
  return data;
};

// Become warehouse owner
export const becomeWarehouseOwner = async () => {
  const { data } = await apiClient.post('/user/become-warehouse-owner');
  return data;
};

// Upload verification document
export const uploadVerificationDocument = async (file, documentType) => {
  const form = new FormData();
  form.append('document', file);
  form.append('documentType', documentType);
  const { data } = await apiClient.post('/user/verification-document', form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};