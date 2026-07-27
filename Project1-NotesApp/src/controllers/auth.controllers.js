import { User } from "../models/user.models.js";
import { Session } from "../models/session.models.js";
import { createSessionAndTokens } from "../utils/auth.utils.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function registerUser (req, res) {

    const { username, email, password } = req.body;

    try {

        if ( !username || !email || !password ) {
            return res.status(400).json({
                message: "Username or email and password are required"
            });
        }


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

        const user = await User.create({
            username,
            email,
            password: hashedPassword
        });

        const accessToken = await createSessionAndTokens(user, req, res);

        return res.status(201).json({
            message: "User registered successfully",
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

export async function login (req, res) {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Username or email and password must be provided"
            });
        }

        const user = await User.findOne({email});

        if (!user) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                message: "Invalid email or password"
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
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

        const session = await Session.findById(decoded.sessionId);

        if (!session || session.revoked) {
            res.clearCookie("refreshToken");
            return res.status(401).json({ message: 
                "Session already invalid" 
            });
        }

        const isValid = await bcrypt.compare(refreshToken, session.refreshTokenHashed);

        if (!isValid) {
            return res.status(401).json({
                message: "Token mismatch"
            });
        }

        session.revoked = true;
        await session.save();

        res.clearCookie("refreshToken");

        return res.status(200).json({
            message: "Logged out successfully"
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

        const oldRefreshToken = req.cookies.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({
                message: "Refresh token not found"
            });
        }

        const decoded = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);

        const session = await Session.findById(decoded.sessionId);

        if (!session || session.revoked) {
            return res.status(401).json({
                message: "Session already invalid"
            });
        }

        const isValid = await bcrypt.compare(oldRefreshToken, session.refreshTokenHashed);

        if (!isValid) {

            // if refreshtoken doesnt meet the current refresh token revoke the session

            session.revoked = true;
            await session.save();

            return res.status(401).json({
                message: "Invalid referesh token"
            });
        }

        // generate new refresh token

        const newRefreshToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: session._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRY
            }   
        );

        session.refreshTokenHashed = await bcrypt.hash(newRefreshToken, 10);
        await session.save();

        const accessToken = jwt.sign(
            {
                id: decoded.id,
                sessionId: session._id
            },
            process.env.JWT_ACCESS_SECRET,

            {
                expiresIn: process.env.JWT_ACCESS_EXPIRY
            }
        );

        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: Number(
                process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE
            )
        });

        return res.status(200).json({
            message: "Token refreshed successfully",
            accessToken
        });

    } catch(error) {
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