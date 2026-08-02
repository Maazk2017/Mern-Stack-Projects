import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { register, clearAuthError } from "./authSlice";
import Loader from "../../components/Loader";

export default function Register() {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { status, error, isAuthenticated } = useSelector((state) => state.auth);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });

    useEffect(() => {
        dispatch(clearAuthError());
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate, dispatch]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(register(formData));
        if (register.fulfilled.match(resultAction)) {
            navigate("/");
        }
    }; 



    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4 fw-bold">Register</h2>
                            
                            {error && (
                                <div className="alert alert-danger alert-dimissible fade show" role="alert">
                                    {error}
                                </div>
                            )}
                            
                            <form onSubmit={handleSubmit}>

                                <div className="form-group mb-3">
                                    <label htmlFor="username" className="form-label">
                                        Username
                                    </label>
                                    <input 
                                        type="text"
                                        className="form-control"
                                        id="username"
                                        name="username"
                                        placeholder="Enter your username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="email" className="form-lable">
                                        Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group mb-4">
                                    <label htmlFor="password" className="form-label">
                                        Password
                                    </label>
                                    <input 
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />  
                                </div>

                                <button disabled={status === "loading"} type="submit" className="btn btn-success w-100 py-2 fw-semibold">
                                    {status === "loading" ? (
                                        <>
                                            <Loader message="Registering..." />
                                        </>
                                    ): (
                                        "Sign Up"
                                    )}
                                </button>

                            </form>

                            <hr className="my-4"/>

                            <p className="text-center mb-0">
                                Already have an account? {" "}
                                <Link to="/login" className="text-decoration-none fw-semibold">
                                    Login Here
                                </Link>
                            </p>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}