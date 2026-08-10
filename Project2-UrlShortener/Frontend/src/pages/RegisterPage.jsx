import { useDispatch } from "react-redux";
import { useRegisterMutation } from "../features/auth/authApi";
import { Link, useNavigate } from "react-router-dom";
import { setCredentials } from "../features/auth/authSlice";
import toast from "react-hot-toast";
import { useState } from "react";

export default function RegisterPage () {

    const [form, setForm] = useState({ username: "", email: "", password: ""});
    const [register, { isLoading }] = useRegisterMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value})
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const data = await register(form).unwrap();
            dispatch(setCredentials({ user: data.user, accessToken: data.accessToken }));
            navigate("/");
        } catch (err) {
            toast.error(err.data?.message || "Registration failed");
        }
    }

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h1 className="h3 mb-4">Register</h1>
            <form onSubmit={handleSubmit} className="card card-body bg-dark">
                <div className="mb-3">
                    <label className="form-label">Username</label>
                    <input name="username" required className="form-control" value={form.username} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input name="email" type="email" required className="form-control" value={form.email} onChange={handleChange} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input name="password" type="password" required className="form-control" value={form.password} onChange={handleChange} />
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? "Registering..." : "Register"}
                </button>
            </form>
            <p className="mt-3">
                Already have an account? <Link to="/login">Login</Link>
            </p>
        </div> 
    )
}