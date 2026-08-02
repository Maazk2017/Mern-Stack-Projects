import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { fetchUser } from './features/auth/authSlice';

import Login from './features/auth/Login';
import ProtectedRoute from "./components/ProtectedRoute";
import Register from './features/auth/Register';
import Navbar from './components/Navbar';
import NotesDashboard from "./features/notes/NoteDashboard";

function App() {
  const dispatch = useDispatch();
  // Check if user has an active session cookie on app load
  useEffect(() => {
    dispatch(fetchUser());
  }, [dispatch]);

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
