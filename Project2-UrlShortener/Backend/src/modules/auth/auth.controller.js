import { User } from "./authUser.model.js";
import { createSessionAndTokens } from "../utils/auth.utils.js";
import { Session } from "./authSession.model.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";


export async function registerUser(req, res) {

    try {

        const { username, email, password } = req.body;

        const userExists = await User.findOne({
            $or: [
                { username },
                { email }
            ]
        });

        if (userExists) {
            return res.status(409).json({
                message: "Username or email already exist"
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
            message: "User successfully registered",
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

export async function login(req, res) {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({
                message: "Email does not exists!"
            });
        }

        const isEqual = await bcrypt.compare(password, user.password);

        if (!isEqual) {
            return res.status(400).json({
                message: "Incorrect password!"
            });
        }

        const accessToken = await createSessionAndTokens(user, req, res);

        return res.status(200).json({
            message: "User successfully logged in",
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

export async function logout(req, res) {
    try {

        const oldRefreshToken = req.cookies?.refreshToken;

        if (!refreshToken) {
            return res.status(401).json({
                message: "No active session"
            });
        }

        const decodedOldRefreshToken = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);

        const session = await Session.findById(decodedOldRefreshToken.sessionId);

        if (!session || session.revoked) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Session already invalid"
            });
        }

        const isEqual = await bcrypt.compare(oldRefreshToken, session.refreshTokenHashed);

        if (!isEqual) {
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

export async function refreshToken(req, res) {
    try {

        const oldRefreshToken = req.cookies?.refreshToken;

        if (!oldRefreshToken) {
            return res.status(401).json({
                message: "No active session"
            });
        }

        let decodedOldRefreshToken;

        try {
            decodedOldRefreshToken = jwt.verify(oldRefreshToken, process.env.JWT_REFRESH_SECRET);
        } catch (error) {
            return res.status(401).json({
                message: "Refresh token expired or invalid"
            });
        }

        const user = await User.findById(decodedOldRefreshToken.id);
        if (!user) {
            return res.status(401).json({
                message: "User no longer exists"
            });
        }

        const session = await Session.findById(decodedOldRefreshToken.sessionId);

        if (!session || session.revoked) {
            res.clearCookie("refreshToken");
            return res.status(401).json({
                message: "Session already expired"
            });
        }

        // Ensure database record has the hashed value
        if (!session.refreshTokenHashed) {
            return res.status(500).json({
                message: "Session is missing hashed token record"
            });
        }

        const isEqual = await bcrypt.compare(oldRefreshToken, session.refreshTokenHashed);

        if (!isEqual) {
            // Reuse/Tamper Detection: Revoke session
            session.revoked = true;
            await session.save();
            res.clearCookie("refreshToken");

            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        // 2. Generate new refresh token 
        const newRefreshToken = jwt.sign(
            {
                id: decodedOldRefreshToken.id,
                sessionId: session._id
            },
            process.env.JWT_REFRESH_SECRET,
            {
                expiresIn: process.env.JWT_REFRESH_EXPIRY || "7d"
            }
        );

        // 3. Update session object with the new hash before saving
        session.refreshTokenHashed = await bcrypt.hash(newRefreshToken, 10);
        await session.save();

        // 4. Generate new access token
        const accessToken = jwt.sign(
            {
                id: decodedOldRefreshToken.id
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
            accessToken
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