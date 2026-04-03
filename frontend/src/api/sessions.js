import axiosInstance from "../lib/axios";

export const sessionApi = {
  createSession: async (data) => {
    const response = await axiosInstance.post("/sessions", data);
    return response.data;
  },

  getActiveSessions: async () => {
    const response = await axiosInstance.get("/sessions/active");
    return response.data;
  },
  getMyRecentSessions: async () => {
    const response = await axiosInstance.get("/sessions/my-recent");
    return response.data;
  },

  getSessionById: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}`);
    return response.data;
  },

  joinSession: async ({ id, password }) => {
    const response = await axiosInstance.post(`/sessions/${id}/join`, {
      password,
    });
    return response.data;
  },
  endSession: async ({ id }) => {
    const response = await axiosInstance.post(`/sessions/${id}/end`);
    return response.data;
  },
  getStreamToken: async () => {
    const response = await axiosInstance.get(`/chat/token`);
    return response.data;
  },
  startRecording: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/recording/start`);
    return response.data;
  },
  stopRecording: async (id) => {
    const response = await axiosInstance.post(`/sessions/${id}/recording/stop`);
    return response.data;
  },
  getRecordings: async (id) => {
    const response = await axiosInstance.get(`/sessions/${id}/recordings`);
    return response.data;
  },
};