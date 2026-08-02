import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { registerUser, loginUser, logoutUser, getUser } from "../../api/authApi";

/*
    createAsyncThunk is a Redux Toolkit function used to handle asynchronous operations (API calls, database requests, timers, etc.) inside Redux.

    Normally Redux reducers must be synchronous:

    Button click
    ↓
    dispatch(action)
    ↓
    reducer updates state

    But API calls are asynchronous:

    Button click
    ↓
    Call API (takes time)
    ↓
    Receive response/error
    ↓
    Update Redux state

    createAsyncThunk helps you manage this flow automatically.

*/

export const register = createAsyncThunk(
  "auth/register",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await registerUser(userData);
      // Access token from response body
      localStorage.setItem("accessToken", response.data.accessToken);
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Registration failed");
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (userData, { rejectWithValue }) => {
    try {
      const response = await loginUser(userData);
      localStorage.setItem("accessToken", response.data.accessToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Login failed");
    }
  }
);

export const logout = createAsyncThunk(
    "auth/logout",
    async (_, { rejectWithValue}) => {
        try {
            const data = await logoutUser();
            return data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "logout failed");
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

// Auth Slice
const intialState = {
    user: null,
    isAuthenticated: false,
    status: "idle",
    error: null
};

const authSlice = createSlice({
    name: "auth",
    initialState: intialState,
    reducers: {
        clearAuthError: (state) => {
            state.error = null;
        },
    },

    extraReducers: (builder) => {
        builder
            .addCase(register.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })

            .addCase(register.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload.user || action.payload;
                state.isAuthenticated = true;
            })

            .addCase(register.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload || "Registration failed";
            })

            // --- Login ---
            .addCase(login.pending, (state) => {
                state.status = "loading";
                state.error = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                state.status = "succeeded";
                state.user = action.payload.user || action.payload;
                state.isAuthenticated = true;
            })
            .addCase(login.rejected, (state, action) => {
                state.status = "failed";
                state.error = action.payload;
            })

            // --- Logout ---
            .addCase(logout.fulfilled, (state) => {
                state.user = null;
                state.isAuthenticated = false;
                state.status = "idle";
                state.error = null;
            })

            // --- Fetch Current User ---
            .addCase(fetchUser.fulfilled, (state, action) => {
                state.user = action.payload.user || action.payload;
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