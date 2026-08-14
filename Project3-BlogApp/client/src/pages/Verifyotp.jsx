import React, { useState } from 'react'
import { useResendOtp, useVerifyOtp } from '../features/auth/authApi'
import { useLocation, useNavigate } from 'react-router-dom';

const Verifyotp = () => {

    const verifyOtp = useVerifyOtp();
    const resendOtp = useResendOtp();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId, email } = location.state || {};
    const [otp, setOtp] = useState("");

    if (!userId) {
        return (
            <div className='container mt-5'>
                <p>Missing registration info - please register again.</p>
            </div>
        )
    }

    async function handleSubmit (e) {
        e.preventDefault();
        try {
            await verifyOtp.mutateAsync({ userId, otp });
            navigate("/");
        } catch (err) {
            console.error("Error: ", err);
        }
    }
    
    return (
        <div className='container' style={{ maxWidth: 420, marginTop: "4rem" }}>
            <h2 className='mb-4'>Verify your email</h2>
            <p className='text-muted'>We sent a code to {email}</p>

            {verifyOtp.isError && (
                <div className="alert alert-danger">
                    {verifyOtp.error?.response?.data?.message || "Verification failed"}
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className='mb-3'>
                    <label className='form-label'>OTP code</label>
                    <input className="form-control" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={6} required />
                </div>

                <button className='btn btn-primary w-100 mb-2' type="submit" disabled={verifyOtp.isPending}>
                    {verifyOtp.isPending ? "Verifying..." : "Verify"}
                </button>

                <button type="button" className='btn btn-link w-100' disabled={resendOtp.isPending} onClick={() => resendOtp.mutate({ email })}>
                    {resendOtp.isPending ? "Sending..." : "Resend code"}
                </button>

                {resendOtp.isError && (
                    <div className="alert alert-danger">
                        {resendOtp.error?.response?.data?.message || "Failed to resend OTP"}
                    </div>
                )}

            </form>
        </div>
    )
}

export default Verifyotp