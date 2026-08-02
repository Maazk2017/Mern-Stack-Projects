import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

export default function ProtectedRoute () {
    const { isAuthenticated, status } = useSelector((state) => state.auth);

    // Show full-screen loader while checking initial auth status
    if (status === "loading" && !isAuthenticated) {
        return <Loader message="Verifying Session..."/>;
    }

    // Redirect to login if not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Render child routes if authenticated
    return <Outlet />
}