import React from "react";
import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom"

const ProtectedRoutes = ({ children }) => {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoutes;
