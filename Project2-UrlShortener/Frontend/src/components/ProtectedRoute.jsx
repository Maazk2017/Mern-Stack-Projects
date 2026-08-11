import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "./Loader";

export default function ProtectedRoute({ children }) {
  const { accessToken, isInitializing } = useSelector((state) => state.auth);

  if (isInitializing) {
    return <Loader />;
  }

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return children;
}