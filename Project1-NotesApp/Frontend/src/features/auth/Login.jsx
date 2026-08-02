import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { login, clearAuthError } from "./authSlice";
import Loader from "../../components/Loader";

export default function Login () {

    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { status, error, isAuthenticated } = useSelector((state) => state.auth);

    useEffect(() => {
        dispatch(clearAuthError());
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate, dispatch]);


    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const resultAction = await dispatch(login(formData));
        if (login.fulfilled.match(resultAction)) {
            navigate("/");
        }
    };

    return (
        <div className="container mt-5">
            <div className="row justify-content-center">
                <div className="col-md-6 col-lg-5">
                    <div className="card shadow-lg border-0">
                        <div className="card-body p-4">
                            <h2 className="card-title text-center mb-4 fw-bold">
                                Sign In
                            </h2>

                            {error && (
                                <div className="alert alert-danger alert-dismissible fade show" role="alert">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleSubmit}>
                                <div className="form-group mb-3">
                                    <label htmlFor="email" className="form-label">
                                        Email Address
                                    </label>
                                    <input 
                                        type="email"
                                        className="form-control"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="form-group mb-3">
                                    <label htmlFor="password" className="form-label">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="form-control"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button disabled={status === "loading"} type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                                    {status === "loading" ? (
                                        <>
                                            <Loader message="Logging In"/>
                                        </>
                                    ): (
                                        "Login"
                                    )}
                                </button>

                            </form>

                            <hr className="my-4" />

                            <p className="text-center mb-0">
                                Don't have an account? {" "}
                                <Link to="/register" className="text-decoration-none fw-semibold">
                                    Register Here...
                                </Link>
                            </p>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}