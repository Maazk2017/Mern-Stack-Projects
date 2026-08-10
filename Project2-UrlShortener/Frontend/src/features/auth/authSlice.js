import { createSlice } from "@reduxjs/toolkit";

const authSlice = createSlice({
    name: "auth",
    initialState: {
        user: null,
        accessToken: null,
        isInitializing: true // true until we've attempted the silent refresh on app load
    },

    reducers: {
        setCredentials: (state, action) => {
            state.user = action.payload.user;
            state.accessToken = action.payload.accessToken;
        },

        clearCredentials: (state) => {
            state.user = null;
            state.accessToken = null;
        },

        setInitialized: (state) => {
            state.isInitializing = false;
        }
    }
});

export const { setCredentials, clearCredentials, setInitialized } = authSlice.actions;
export default authSlice.reducer;