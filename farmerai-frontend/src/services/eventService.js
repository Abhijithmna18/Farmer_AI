import apiClient from "./apiClient";

export const registerEvent = async (data) => {
  try {
    const response = await apiClient.post("/events/register", data);
    return response.data;
  } catch (error) {
    // Re-throw a more specific error to be caught by the component
    throw new Error(error.response?.data?.message || "Failed to register for the event.");
  }
};

export const hostEvent = async (data) => {
  try {
    const response = await apiClient.post("/events/host", data);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to host event.");
  }
};

export const getEvents = async () => {
  try {
    const response = await apiClient.get("/events");
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || "Failed to fetch events.");
  }
};