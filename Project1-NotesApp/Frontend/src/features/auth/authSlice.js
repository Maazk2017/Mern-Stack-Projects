import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerUser, loginUser, logoutUser, getUser, refreshToken as refreshTokenApi } from "../../api/authApi";

// 1. Silent Refresh (Hydrates token in memory on app startup)
export const refreshToken = createAsyncThunk(
    "auth/refreshToken",
    async (_, { rejectWithValue }) => {
        try {
            const data = await refreshTokenApi();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Session expired");
        }
    }
);

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await registerUser(userData);
      return data; // registerUser already returns response.data — don't unwrap twice
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const data = await loginUser(userData);
      return data; // same fix here
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const logout = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue }) => {
        try {
            const data = await logoutUser();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Logout failed");
        }
    }
);

export const fetchUser = createAsyncThunk(
    "auth/getMe",
    async (_, { rejectWithValue }) => {
        try {
            const data = await getUser();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Session expired");
        }
    }
);

const initialState = {
    user: null,
    isAuthenticated: false,
    isInitializing: true,
    status: "idle",
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(refreshToken.pending, (state) => {
                state.isInitializing = true;
            })
            .addCase(refreshToken.fulfilled, (state, action) => {
                state.isInitializing = false;
                state.user = action.payload?.user || null;
                state.isAuthenticated = true;
            })
            .addCase(refreshToken.rejected, (state) => {
                state.isInitializing = false;
                state.user = null;
                state.isAuthenticated = false;
            })

            .addCase(register.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload?.user || null;
                state.isAuthenticated = true;
            })
            .addCase(register.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Registration failed";
            })

            .addCase(login.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload?.user || null;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.status = "idle";
                state.error = null;
            })

            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload?.user || null;
                state.isAuthenticated = true;
            })
            .addCase(fetchUser.rejected, (state) => {
                state.user = null;
                state.isAuthenticated = false;
            });
    },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;