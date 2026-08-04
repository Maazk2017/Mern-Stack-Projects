import api, { setAccessToken, clearAccessToken } from "./axiosInstance";

export const registerUser = async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
};

export const loginUser = async (userData) => {
    const response = await api.post("/auth/login", userData);
    // Save the returned access token directly into memory
    if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken)
    }
    return response.data;
};

export const logoutUser = async () => {
    try {
        const response = await api.post("/auth/logout");
        return response.data;
    } finally {
        // Always clear the in-memory token on logout, even if the backend call fails
        clearAccessToken();
    }

};

export const getUser = async () => {
    const response = await api.get("/auth/getMe");
    return response.data;
};

export const refreshToken = async () => {
    const response = await api.post("/auth/refreshToken");
    // Hydrate in-memory token on initial app load or explicit refresh calls
    if (response.data?.accessToken) {
        setAccessToken(response.data.accessToken);
    }
    return response.data;
};