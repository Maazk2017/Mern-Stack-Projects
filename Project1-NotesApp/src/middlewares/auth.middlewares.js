import jwt from "jsonwebtoken";

export async function verifyJWT(req, res, next) {
    try {

        const authHeader = req.headers.authorization || req.headers.Authorization;

        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ 
                message: "Unauthorized access: No token provided" 
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        req.user = decoded;
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
