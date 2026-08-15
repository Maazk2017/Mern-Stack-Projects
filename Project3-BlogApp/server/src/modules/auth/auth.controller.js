import { User } from "./user.model.js";
import { createSessionAndTokens, generateOTP } from "../utils/auth.utils.js";
import { Session } from "./session.model.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { sendOtpEmail } from "./auth.service.js";

export async function register(req, res) {
    try {
        const { username, email, password } = req.body;
        console.log(req.body);
        const userExists = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (userExists) {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // 1. Generate & Hash OTP
        const rawOtp = await generateOTP();
        console.log(rawOtp);
        const hashedOtp = await bcrypt.hash(rawOtp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        

        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            otp: {
                code: hashedOtp,
                expiresAt: otpExpiry
            }
        });

        // send otp Email 
        await sendOtpEmail(email, rawOtp);

        return res.status(201).json({
            message: "User registered. Please check your email for the verification OTP",
            userId: user._id
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function login(req, res) {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                message: "Email does not exists"
            });
        }

        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({
                message: "Incorrect password"
            });
        }

        // verify account status 
        if (!user.isVerified) {
            return res.status(403).json({
                message: "Please verify your email via OTP before logging in",
                userId: user._id
            });
        }

        const accessToken = await createSessionAndTokens(user, req, res);

        return res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function logout (req, res) {

    try {
        const refreshToken = req.cookies?.refreshToken;
        
        if (!refreshToken) {
            return res.status(401).json({
                message: "No active session"
            })
        }

        let decodedRefreshToken;
        try {
            decodedRefreshToken = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const session = await Session.findById(decodedRefreshToken.sessionId);

        if (!session || session.revoked) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Session already expired"
            });
        }

        const isEqual = await bcrypt.compare(refreshToken, session.hashedRefreshToken);

        if (!isEqual) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function refreshToken (req, res) {
    try {
        const oldRefreshToken = req.cookies?.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({
                message: "No active session"
            });
        }

        let decodedRefreshToken;

        try {
            decodedRefreshToken = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Refresh token expired or invalid"
            });
        }

        const session = await Session.findById(decodedRefreshToken.sessionId);


        if (!session || session.revoked) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Session already expired"
            });
        }

        const isEqual = await bcrypt.compare(oldRefreshToken, session.hashedRefreshToken);

        if (!isEqual) {
            session.revoked = true;
            await session.save();
            res.clearCookie("refreshToken");

            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        // Generate new refresh token
        const newRefreshToken = jwt.sign(
            {
                id: decodedRefreshToken.id,
                sessionId: session._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d"
            }
        );

        session.hashedRefreshToken = await bcrypt.hash(newRefreshToken, 10);
        await session.save();

        // Get user using the ID from the decoded refresh token
        const user = await User.findById(decodedRefreshToken.id);

        if (!user) {
            res.clearCookie("refreshToken");

            return res.status(404).json({
                message: "User not found"
            });
        }

        // Generate new access token
        const accessToken = jwt.sign(
            {
                id: decodedRefreshToken.id,
                role: user.role
            },
            process.env.JWT_ACCESS_SECRET,
            {
                expiresIn: process.env.JWT_ACCESS_EXPIRY
            }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            sameSite: "none",
            secure: true,
            maxAge: Number(process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE),
        });


        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function getMe (req, res) {
    try {
        const user = await User.findById(req.user.id).select("-password");

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        return res.status(200).json({
            message: "User fetched successfully",
            user
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function verifyOtp (req, res) {
    try {
        const { userId, otp } = req.body;

        // 1. find user
        const user = await User.findById(userId);
        if (!user || !user.otp?.code) {
            return res.status(400).json({ 
                message: "Invalid request or OTP not found"
            });
        }

        // 2.expiration check
        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({
                message: "OTP has expired Please request a new one."
            });
        }

        // 3.validate OTP code
        const isValid = await bcrypt.compare(otp, user.otp.code);
        if (!isValid) {
            return res.status(400).json({
                message: "Invalid OTP code"
            });
        }

        // 4.update user verification status
        user.isVerified = true;
        user.otp = undefined // clear otp
        await user.save();

        const accessToken = await createSessionAndTokens(user, req, res);

        return res.status(200).json({
            message: "OTP verified successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            },
            accessToken
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function resendOtp (req, res) {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const rawOtp = await generateOTP();
        console.log(rawOtp);
        const hashedOtp = await bcrypt.hash(rawOtp, 10);
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = {
            code: hashedOtp,
            expiresAt: otpExpiry
        }

        await user.save();

        await sendOtpEmail(email, rawOtp);

        return res.status(200).json({
            message: "A new OTP has been sent to your email."
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}