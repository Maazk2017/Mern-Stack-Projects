import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, clearCredentials } from "../auth/authSlice";

// Separate base queries initialized once at module scope
const rawBaseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8000/api/urls",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
    }
});

const authBaseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8000/auth",
    credentials: "include"
});

// Simple mutex implementation to prevent concurrent /refreshToken calls
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
    refreshSubscribers.push(cb);
};

const onRefreshed = (token) => {
    refreshSubscribers.map((cb) => cb(token));
    refreshSubscribers = [];
};

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        if (!isRefreshing) {
            isRefreshing = true;

            const refreshResult = await authBaseQuery(
                { url: "/refreshToken", method: "POST" },
                api,
                extraOptions
            );

            if (refreshResult.data) {
                api.dispatch(
                    setCredentials({
                        user: api.getState().auth.user,
                        accessToken: refreshResult.data.accessToken
                    })
                );

                isRefreshing = false;
                onRefreshed(refreshResult.data.accessToken);

                // Retry original request
                result = await rawBaseQuery(args, api, extraOptions);
            } else {
                isRefreshing = false;
                refreshSubscribers = [];
                api.dispatch(clearCredentials());
            }
        } else {
            // Wait for the active refresh call to finish, then retry
            const retryOriginalRequest = new Promise((resolve) => {
                subscribeTokenRefresh(() => {
                    resolve(rawBaseQuery(args, api, extraOptions));
                });
            });
            result = await retryOriginalRequest;
        }
    }

    return result;
};

export const urlApi = createApi({
    reducerPath: "urlApi",
    baseQuery: baseQueryWithReauth,
    tagTypes: ["Url"],
    endpoints: (builder) => ({
        getMyUrls: builder.query({
            query: () => "/",
            providesTags: ["Url"]
        }),

        createUrl: builder.mutation({
            query: (body) => ({ url: "/", method: "POST", body }),
            invalidatesTags: ["Url"]
        }),

        deleteUrl: builder.mutation({
            query: (slug) => ({ url: `/${slug}`, method: "DELETE" }),
            invalidatesTags: ["Url"]
        }),

        getUrlStats: builder.query({
            query: (slug) => `/${slug}/stats`
        })
    })
});

export const {
    useGetMyUrlsQuery,
    useCreateUrlMutation,
    useDeleteUrlMutation,
    useGetUrlStatsQuery
} = urlApi;