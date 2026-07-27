import { Session } from "../models/session.models.js";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function createSessionAndTokens(user, req, res) {
    const session = await Session.create({
        user: user._id,
        refreshTokenHashed: "pending",
        ip: req.ip,
        useragent: req.headers["user-agent"],
        expiresAt: new Date(Date.now() + Number(process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE))
    });

    const refreshToken = jwt.sign(
        { id: user._id, sessionId: session._id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRY }
    );

    session.refreshTokenHashed = await bcrypt.hash(refreshToken, 10);
    await session.save();

    const accessToken = jwt.sign(
        { id: user._id, sessionId: session._id },
        process.env.JWT_ACCESS_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRY }
    );

    res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: Number(process.env.JWT_REFRESH_TOKEN_COOKIE_MAX_AGE)
    });

    return accessToken;
}