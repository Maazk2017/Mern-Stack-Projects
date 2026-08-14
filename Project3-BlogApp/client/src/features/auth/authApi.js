import { useMutation, useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import axiosInstance from "../../api/axiosInstance";
import { setCredentials, clearCredentials } from "./authSlice";

// useMutation is used when you are changing something on the server.

export function useRegister () {
    return useMutation({
        // mutationFn is the actual function that performs the API request.
        mutationFn: (payload) => axiosInstance.post("/auth/register", payload)
            .then((r) => r.data)
    });
}

export function useVerifyOtp () {
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: (payload) => axiosInstance.post("/auth/verify-otp", payload)
            .then((r) => r.data),
        // Run this only if the request succeeds.
        onSuccess: (data) => {
            dispatch(setCredentials({ user: data.user, accessToken: data.accessToken}));
        }
    });
}

export function useResendOtp () {
    return useMutation({
        mutationFn: (payload) => axiosInstance.post("/auth/resend-otp", payload)
            .then((r) => r.data)
    });
}

export function useLogin () {
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: (payload) => axiosInstance.post("/auth/login", payload)
            .then((r) => r.data),
        onSuccess: (data) => {
            dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }))
        }
    });
}

export function useLogout () {
    const dispatch = useDispatch();
    return useMutation({
        mutationFn: () => axiosInstance.post("/auth/logout")
            .then((r) => r.data),
        // Run this regardless of whether the request succeeds or fails.
        onSettled: () => {dispatch(clearCredentials())}
    });
}

export function useMe (enabled = true) {
    return useQuery({
        // is basically the unique name/identifier for this query's cached data.
        queryKey: ["auth", "me"],
        // Exactly like mutationFn, queryFn is the function that actually talks to your API.
        queryFn: () => axiosInstance.get("/auth/getMe").then((r) => r.data.user),
        enabled
    });
}