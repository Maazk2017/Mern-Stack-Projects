import { configureStore } from "@reduxjs/toolkit";
import { authApi } from "../features/auth/authApi";
import { urlApi } from "../features/urls/urlApi";
import authReducer from "../features/auth/authSlice";

export const store = configureStore({
    reducer: {
        auth: authReducer,
        [authApi.reducerPath]: authApi.reducer,
        [urlApi.reducerPath]: urlApi.reducer
    },
    middleware: (getDefault) =>
        getDefault().concat(authApi.middleware, urlApi.middleware)
});