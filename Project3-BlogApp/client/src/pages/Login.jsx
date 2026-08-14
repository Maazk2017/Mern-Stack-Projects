import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLogin } from '../features/auth/authApi';

const Login = () => {

    const navigate = useNavigate();
    const login = useLogin();
    const [form, setForm] = useState({ email: "", password: ""});

    function handleChange (e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit (e) {
        e.preventDefault();
        try {
            await login.mutateAsync(form);
            navigate("/")
        } catch (err) {
            console.error(err);
        }
    }


    return (
        <div className="container mt-5" style={{ maxWidth: "420px", marginTop: "4rem" }}>
            <h1 className='h3 mb-4'>Login</h1>
            {login.isError && (
                <div className='alert alert-danger'>
                    {login.error?.response?.data?.message || "Login Failed"}
                </div>
            )}
            <form onSubmit={handleSubmit} className='card card-body bg-dark'>
                <div className='mb-3'>
                    <label className='form-label'>Email</label>
                    <input type="email" name="email" required className='form-control' value={form.email} onChange={handleChange} />
                </div>
                <div className='mb-3'>
                    <label className='form-label'>Password</label>
                    <input type="password" name="password" required className='form-control' value={form.password} onChange={handleChange} />
                </div>
                <button type="submit" disabled={login.isPending} className='btn btn-primary'>
                    {login.isPending ? "Logging in..." : "Login"}
                </button>
            </form>
            <p className='mt-3 text-center'>
                No account ? <Link to="/register">Register</Link>
            </p>
        </div>
    )
}

export default Login