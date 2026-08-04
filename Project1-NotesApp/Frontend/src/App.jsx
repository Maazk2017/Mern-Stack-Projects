import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

import { refreshToken } from './features/auth/authSlice';

import Login from './features/auth/Login';
import ProtectedRoute from "./components/ProtectedRoute";
import Register from './features/auth/Register';
import Navbar from './components/Navbar';
import NotesDashboard from "./features/notes/NoteDashboard";

import Loader from './components/Loader';

function App() {
  const dispatch = useDispatch();
  // Select initial loading state from Redux
  const { isInitializing } = useSelector((state) => state.auth);
  // Check if user has an active session cookie on app load
  useEffect(() => {
    // Silent refresh hydrates in-memory token on full page load
    dispatch(refreshToken());
  }, [dispatch]);

  if (isInitializing) {
    return <Loader message="Loading authentication..."/>
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<NotesDashboard />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

    </>
  )
}

export default App
