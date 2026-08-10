import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { setCredentials, clearCredentials } from "../auth/authSlice";

const rawBaseQuery = fetchBaseQuery({
    baseUrl: "http://localhost:8000/api/urls",
    credentials: "include",
    prepareHeaders: (headers, { getState }) => {
        const token = getState().auth.accessToken;
        if (token) headers.set("Authorization", `Bearer ${token}`);
        return headers;
    }
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
    let result = await rawBaseQuery(args, api, extraOptions);

    if (result.error?.status === 401) {
        const refreshResult = await fetchBaseQuery({
            baseUrl: "http://localhost:8000/auth",
            credentials: "include"
        }) ({ url: "/refreshToken", method: "POST"}, api, extraOptions)


        if (refreshResult.data) {
            api.dispatch(setCredentials({
                user: api.getState().auth.user,
                accessToken: refreshResult.data.accessToken
            }));
            result = await rawBaseQuery(args, api, extraOptions);
        } else {
            api.dispatch(clearCredentials());
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
            provideTags: ["Url"]
        }),

        createUrl: builder.mutation({
            query: (body) => ({ url: "/", method: "POST", body}),
            invalidatesTags: ["Url"]
        }),

        deleteUrl: builder.mutation({
            query: (slug) => ({ url: `/${slug}`, method: "DELETE"}),
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