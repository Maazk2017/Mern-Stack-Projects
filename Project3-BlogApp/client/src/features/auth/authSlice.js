import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        accessToken: null,
        isAuthenticated: null,
        // true until the app's first silent-refresh attempt on load resolves —
        // prevents flashing the login page for users with a valid refresh cookie
        isBootstarpping: true
    },

    reducers: {
        setCredentials: (state, action) => {
            const { user, accessToken } = action.payload;
            if (user) state.user = user;
            if (accessToken) state.accessToken = accessToken;
            state.isAuthenticated = true
        },

        clearCredentials: (state) => {
            state.user = null,
            state.accessToken = null,
            state.isAuthenticated = false
        },
        
        setBootstrapped: (state) => {
            state.isBootstarpping = false
        }
    }
});

export const { setCredentials, clearCredentials, setBootstrapped } = authSlice.actions;
export default authSlice.reducer;