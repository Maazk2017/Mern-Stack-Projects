import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLazyGetMeQuery } from './features/auth/authApi';
import { clearCredentials, setCredentials, setInitialized } from './features/auth/authSlice';

import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import StatsPage from "./pages/StatsPage";
import Loader from './components/Loader';

function App() {
  const dispatch = useDispatch();
  const [getMe] = useLazyGetMeQuery();
  const isInitializing = useSelector((state) => state.auth.isInitializing);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Direct fetch call guarantees credentials are sent without RTK Query lifecycle interference
        const response = await fetch("http://localhost:8000/auth/refreshToken", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include"
        });

        if (!response.ok) {
          throw new Error("Refresh failed");
        }

        const refreshData = await response.json();
        let user = refreshData.user;

        // 1. Instantly set token into Redux state
        dispatch(setCredentials({ accessToken: refreshData.accessToken, user: null }));

        // 2. If backend didn't attach user object directly on refresh response, fetch user
        if (!user) {
          const meData = await getMe().unwrap();
          user = meData.user;
        }

        if (isMounted) {
          dispatch(setCredentials({ user, accessToken: refreshData.accessToken }));
        }
      } catch (err) {
        if (isMounted) {
          dispatch(clearCredentials());
        }
      } finally {
        if (isMounted) {
          dispatch(setInitialized());
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []); // Run ONCE on app load

  if (isInitializing) {
    return <Loader />;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/stats/:slug"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;