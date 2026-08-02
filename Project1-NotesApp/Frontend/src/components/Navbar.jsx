import React, { useState } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";

export default function Navbar () {

    const [isSelected, setIsSelected] = useState("login");

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { user, isAuthenticated } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate("/login");
    };

    return (
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm mb-4">
            <div className="container">
                <Link className="navbar-brand fw-bold" to="/">
                   📝 NotesApp 
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarColor" aria-controls="navbarColor" aria-expanded="false" aria-label="Toggle navigation">
                    <span className="navbar-toggle-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="navbarColor">
                    <ul className="navbar-nav me-auto">
                        {isAuthenticated && (
                            <li className="nav-item">
                                <Link className="nav-link active" to="/">
                                    My Notes
                                </Link>
                            </li>
                        )}
                    </ul>
                </div>

                <div className="d-flex align-itmes-center gap-3">
                    {isAuthenticated ? (
                        <>
                            <span className="navbar-text text-light fw-medium">
                                Welcome, <strong>{user?.username || user?.email}</strong>
                            </span>
                            <button onClick={handleLogout} className="btn btn-outline-ligth btn-sm px-3">
                                Logout
                            </button>
                        </>
                    ): (
                        <>
                            <Link to="/login" onClick={() => setIsSelected("login")} className={`btn btn-sm me-2 ${isSelected === "login" ? "btn-light" : "btn-outline-light" }`}>Login</Link>
                            <Link to="/register" onClick={() => setIsSelected("register")}  className={`btn btn-sm ${isSelected === "register" ? "btn-light" : "btn-outline-light" } `}>
                                Register
                            </Link>
                        </>
                    )}
                </div>

            </div>
            
        </nav>
    )
}