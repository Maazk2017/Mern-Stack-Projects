import { useEffect } from 'react'
import { Routes } from 'react-router-dom'
import { Route } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useRefreshMutation, useLazyGetMeQuery } from './features/auth/authApi'
import { clearCredentials, setCredentials, setInitialized } from './features/auth/authSlice'

import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import StatsPage from "./pages/StatsPage";
import Loader from './components/Loader';


function App() {

  const dispatch = useDispatch();
  const [refresh] = useRefreshMutation();
  const [getMe] = useLazyGetMeQuery();
  const isInitializing = useSelector((state) => state.auth.isInitializing);

  useEffect(() => {
    (async () => {
      try {
        const refreshData = await refresh().unwrap();
        // if refreshToken response doesn't include `user`, fetch it separately
        let user = refreshData.user;
        if (!user) {
          const meData = await getMe().unwrap();
          user = meData.user;
        }
        dispatch(setCredentials({ user, accessToken: refreshData.accessToken }));
      } catch {
        dispatch(clearCredentials());
      } finally {
        dispatch(setInitialized());
      }
    })();
  }, []);

  if (isInitializing) {
    return <Loader />
  }

  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute> <DashboardPage /> </ProtectedRoute>} />
        <Route path="/stats/:slug" element={<ProtectedRoute> <StatsPage /> </ProtectedRoute>} />
      </Routes>
    </>
  )
}

export default App
