import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const authApi = createApi({
    reducerPath: "authApi",
    baseQuery: fetchBaseQuery({
        baseUrl: "http://localhost:8000/auth",
        credentials: "include"
    }),

    endpoints: (builder) => ({
        register: builder.mutation({
            query: (body) => ({ url: "/register", method: "POST", body })
        }),

        login: builder.mutation({
            query: (body) => ({ url: "/login", method: "POST", body})
        }),

        logout: builder.mutation({
            query: () => ({ url: "/logout", method: "POST"})
        }),

        refresh: builder.mutation({
            query: () => ({ url: "/refreshToken", method: "POST"})
        }),

        getMe: builder.query({
            query: () => "/getMe"
        })
    })
});

export const {
    useRegisterMutation,
    useLoginMutation,
    useLogoutMutation,
    useRefreshMutation,
    useLazyGetMeQuery
} = authApi;