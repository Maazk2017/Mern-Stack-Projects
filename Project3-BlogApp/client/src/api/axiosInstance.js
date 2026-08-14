import axios from "axios";
import store from "../app/store";
import { setCredentials, clearCredentials } from "../features/auth/authSlice";

const axiosInstance = axios.create({
    baseURL: "http://localhost:8000",
    // Allows the browser to send the httpOnly refresh-token cookie
    // with requests to our backend.
    withCredentials: true,
});

// This runs BEFORE every request made with axiosInstance.
axiosInstance.interceptors.request.use((config) => {

    // Get the current access token from Redux.
    const token = store.getState().auth.accessToken;

    // If we have an access token...
    if (token) {

        // Add the token to the Authorization header.
        // Backend will receive:
        // Authorization: Bearer <token>
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Return the request configuration so axios can send the request.
    return config;
});

// This variable will store the refresh request while it is running.
//
// Example:
// Request A → 401
// Request B → 401
// Request C → 401
//
// Instead of making 3 refresh requests,
// all three can wait for the SAME refresh request.
let refreshPromise = null;

// This runs after every response from the server.
axiosInstance.interceptors.response.use(

    // If the request succeeds, simply return the response.
    (response) => response,

    // If the request fails, this function runs.
    async (error) => {

        // Get the request that originally failed.
        const originalRequest = error.config;

        // Get the HTTP status code.
        const status = error.response?.status;


        // Check whether the failed request was already an authentication request.
        const isAuthRoute =
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/login") ||
            originalRequest.url?.includes("/auth/register");


        // We only try to refresh the token when:
        //
        // 1. Server returned 401
        // 2. We haven't already retried this request
        // 3. The request isn't login/register/refresh
        if (status === 401 && !originalRequest._retry && !isAuthRoute) {
            // Mark this request as retried.
            //
            // This prevents an infinite loop if the new access token
            // also causes a 401.
            originalRequest._retry = true;

            try {

                // If a refresh request isn't already running...
                if (!refreshPromise) {

                    // Ask the backend for a new access token.
                    // The refresh-token cookie is automatically sent because
                    // we configured withCredentials: true.
                    refreshPromise = axiosInstance
                        .post("/auth/refresh")

                        // When the refresh request finishes,
                        // allow another refresh request to happen later.
                        .finally(() => {
                            refreshPromise = null;
                        });
                }


                // Wait for the refresh request.
                //
                // If another request already started the refresh,
                // this waits for that same request.
                const { data } = await refreshPromise;


                // Save the new access token in Redux.
                store.dispatch(setCredentials({accessToken: data.accessToken}));

                // Put the new access token into the failed request.
                originalRequest.headers.Authorization =
                    `Bearer ${data.accessToken}`;

                // Send the original request again.
                return axiosInstance(originalRequest);


            } catch (refreshError) {

                // Refresh failed.
                // This usually means the refresh token is expired,
                // invalid, revoked, etc.
                store.dispatch(clearCredentials());


                // Return the refresh error to whoever made the request.
                return Promise.reject(refreshError);
            }
        }


        // If the error wasn't a 401 that we should refresh,
        // just return the error normally.
        return Promise.reject(error);
    }
);

// Export the configured axios instance.
export default axiosInstance;