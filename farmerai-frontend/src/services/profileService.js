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