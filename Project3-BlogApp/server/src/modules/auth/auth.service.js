import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOtpEmail (email, otp) {
    await resend.emails.send({
        from: "onboarding@resend.dev",
        to: email,
        subject: "Your verification code",
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Email Verification</h2>
                <p>Your one-time password (OTP) is:</p>
                <h1 style="color: #4F46E5; letter-spacing: 4px;">${otp}</h1>
                <p>This code expires in <strong>10 minutes</strong>.</p>
            </div>
        `
    });
}