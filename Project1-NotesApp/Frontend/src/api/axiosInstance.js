import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true // Sends the HttpOnly refreshToken cookie automatically
});

// 1. Request Interceptor: Attach Access Token from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 2. Response Interceptor: Catch 401s and Refresh Tokens Silently
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Fixed Scope: Check if error is specifically 401 and not retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Prevents retrying the refresh endpoint itself if it fails with 401
      if (originalRequest.url.includes("/auth/refreshToken")) {
        localStorage.removeItem("accessToken");
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        // Hits backend refreshToken controller function
        const res = await api.post("/auth/refreshToken");
        const newAccessToken = res.data.accessToken;

        // Save new access token
        localStorage.setItem("accessToken", newAccessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh token invalid/revoked -> clear token and redirect to login
        localStorage.removeItem("accessToken");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    // Return all non-401 errors directly to callers
    return Promise.reject(error);
  }
);

export default api;