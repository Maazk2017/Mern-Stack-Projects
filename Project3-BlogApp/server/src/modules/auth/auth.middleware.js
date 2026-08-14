import { ZodError } from "zod";
import jwt from "jsonwebtoken";
import rateLimit from "express-rate-limit";

export const validate = (schema) => {
    return (req, res, next) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    error: error.issues.map(issue => ({
                        field: issue.path[0],
                        message: issue.message
                    }))
                })
            }
            next(error);
        }
    }
}

export async function verifyJWT (req, res, next) {
    try {

        const authHeader = req.headers.authorization || req.headers.Authorization;
        
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Unauthorized access! No token provided"
            });
        }

        const accessToken = authHeader.split(" ")[1]

        const decodedAccessToken = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);

        req.user = decodedAccessToken;
        next();


    } catch (error) {

        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ message: "Access token expired" });
        }

        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ message: "Invalid access token" });
        }
        
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
} 

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, //15 min
    limit: 50,  // limit each IP to 50 req per 'window' => means one device can only send 100 req in 15 min
    standardHeaders: 'draft-8', // adds RateLimit-* headers to the response
    legacyHeaders: false, // disables the older X-RateLimit-* headers
    message: {
        message: "Too many authentication requests from this IP. Please try again after 15 minutes."
    }
});