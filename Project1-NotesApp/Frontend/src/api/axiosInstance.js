import axios from "axios";

// In-Memory Token Storage (Private to this module scope)
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
}

const api = axios.create({
  baseURL: "http://localhost:8000/api",
  withCredentials: true // Sends the HttpOnly refreshToken cookie automatically
});

// 1. Request Interceptor: Attach Access Token from memory
api.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },

  (error) => Promise.reject(error)
);


// 2. Response Interceptor
// Runs after every API response.
// If a request fails with 401 (Unauthorized), it will try to refresh the access token automatically.
api.interceptors.response.use(

  // If the response is successful (200, 201, etc.), simply return it.
  (response) => response,

  // This function runs whenever a response returns an error.
  async (error) => {

    // Save the request that failed.
    // We'll retry this same request after getting a new access token.
    const originalRequest = error.config;

    // Only handle Unauthorized (401) errors.
    // Also ensure this request hasn't already been retried to prevent infinite loops.
    if (error.response?.status === 401 && !originalRequest._retry) {

      // If the refresh token request itself returns 401,
      // don't try refreshing again or we'll create an infinite loop.
      if (originalRequest.url?.includes("/auth/refreshToken")) {
        clearAccessToken();          // Remove expired access token
        return Promise.reject(error); // Pass the error back
      }

      // Mark this request as already retried.
      originalRequest._retry = true;

      try {

        // Send refresh token request.
        // The browser automatically sends the HttpOnly refresh token cookie
        // because Axios was configured with withCredentials: true.
        const res = await api.post("/auth/refreshToken");

        // Extract the newly generated access token from the server response.
        const newAccessToken = res.data.accessToken;

        // Store the new access token in memory/local storage.
        setAccessToken(newAccessToken);

        // Replace the expired token with the new one
        // in the original request's Authorization header.
        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        // Retry the original request.
        // The user receives the response without knowing the token expired.
        return api(originalRequest);

      } catch (refreshError) {

        // Refresh token is also invalid or expired.

        // Remove any stored access token.
        clearAccessToken();

        // Redirect the user to login because authentication is no longer valid.
        window.location.href = "/login";

        // Pass the refresh error back.
        return Promise.reject(refreshError);
      }
    }

    // If the error wasn't a 401 (404, 500, etc.),
    // simply pass it back to the calling code.
    return Promise.reject(error);
  }
);

export default api;