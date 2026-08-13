import { Session } from "../auth/session.model.js";

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";


export async function createSessionAndTokens (user, req, res) {
    const session = await Session.create({
        user: user._id,
        hashedRefreshToken: "pending",
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        expiresAt: new Date(Date.now() + Number(process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE))
    });

    const refreshToken = jwt.sign(
        {
            id: user._id,
            sessionId: session._id
        },

        process.env.JWT_REFRESH_SECRET,

        {
            expiresIn: process.env.JWT_REFRESH_EXPIRY
        }
    );

    const refreshTokenHashed = await bcrypt.hash(refreshToken, 10);
    session.hashedRefreshToken = refreshTokenHashed;
    await session.save();

    const accessToken = jwt.sign(
        {
            id: user._id
        },

        process.env.JWT_ACCESS_SECRET,

        {
            expiresIn: process.env.JWT_ACCESS_EXPIRY
        }
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
        maxAge: Number(process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE),
    }); 

    return accessToken;
}

export async function generateOTP () {
    return crypto.randomInt(100000, 999999).toString();
}