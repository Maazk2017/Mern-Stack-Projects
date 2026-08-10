import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoginMutation } from "../features/auth/authApi";
import { useDispatch } from "react-redux";
import { setCredentials } from "../features/auth/authSlice";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

export default function LoginPage () {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [login, { isLoading }] = useLoginMutation();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    async function handleSubmit (e) {
        e.preventDefault();
        try {
            const data = await login({ email, password }).unwrap();
            dispatch(setCredentials({ user: data.user, accessToken: data.accessToken  }));
            navigate("/");
        } catch (err) {
            toast.error(err.data?.message || "Login Failed");
        }
    }

    return (
        <div className="container mt-5" style={{ maxWidth: "400px" }}>
            <h1 className="h3 mb-4">Login</h1>
            <form onSubmit={handleSubmit} className="card card-body bg-dark">
                <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input type="email" required className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Password</label>
                    <input type="password" required className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                    {isLoading ? "Logging in..." : "Login"}
                </button>
            </form>
            <p className="mt-3">
                No account? <Link to="/register">Register</Link>
            </p>
        </div>
    )
}
