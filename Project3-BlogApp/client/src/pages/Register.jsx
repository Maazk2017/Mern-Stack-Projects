import React, { useState } from 'react';
import { useRegister } from "../features/auth/authApi";
import { useNavigate, Link } from "react-router-dom";

const Register = () => {

    const register = useRegister();
    const navigate = useNavigate();
    const [ form, setForm ] = useState({ username:"", email:"", password:""});
    
    function handleChange (e) {
        setForm({ ...form, [e.target.name]: e.target.value })
    }

    async function handleSubmit (e) {
        e.preventDefault();
        try {
            const data = await register.mutateAsync(form);
            navigate("/verify-otp", { state: { userId: data.userId, email:form.email }})
        } catch (err) {
            console.error("Error: ", err);
        }
    }

    return (
        <div className='container mt-5' style={{maxWidth: "420px", marginTop: "4rem"}}>
            <h1 className='h3 mb-4'>Register</h1>
            {register.isError && (
                <div className='alert alert-danger'>
                    {register.error?.response?.data?.message || "Registration failed"}
                </div>    
            )}
            <form onSubmit={handleSubmit} className='card card-body bg-dark'>
                <div className='mb-3'>
                    <label className='form-label'>Username</label>
                    <input name="username" required className='form-control' value={form.username} onChange={handleChange}/>
                </div>
                <div className='mb-3'>
                    <label className='form-label'>Email</label>
                    <input name="email" type="email" required className='form-control' value={form.email} onChange={handleChange}/>
                </div>
                <div className='mb-3'>
                    <label className='form-label'>Password</label>
                    <input name="password" type="password" required className='form-control' value={form.password} onChange={handleChange}/>
                </div>
                <button type="submit" disabled={register.isPending} className='btn btn-primary'>
                    {register.isPending ? "Creating account..." : "Register"}
                </button>
            </form>
            <p className="mt-3">
                Already have an account ? <Link to="/login">Login</Link>
            </p>
        </div>
    )
}

export default Register