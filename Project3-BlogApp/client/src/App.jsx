import React from 'react'
import { Routes, Route } from "react-router-dom";
import { useSelector } from 'react-redux';
import { useBootstrapAuth } from "./features/auth/useBootstrapAuth";

import './App.css'
import Loader from "./components/Loader";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verifyotp from "./pages/Verifyotp";
import ProtectedRoutes from './pages/ProtectedRoutes';
import Feed from './pages/Feed';

function App() {

  useBootstrapAuth();
  const isBootstrapping = useSelector((s) => s.auth.isBootstrapping);
  // avoids flashing the login page while we check for a valid refresh cookie
  if (isBootstrapping) {
    return (
      <Loader />
    )
  }

  return (
    <Routes>  
      <Route path="/login" element={<Login />}/>
      <Route path="/register" element={<Register />}/>
      <Route path="/verify-otp" element={<Verifyotp />}/>
      <Route path="/" element={<ProtectedRoutes><Feed /></ProtectedRoutes>}/>
    </Routes>
  )
}

export default App
