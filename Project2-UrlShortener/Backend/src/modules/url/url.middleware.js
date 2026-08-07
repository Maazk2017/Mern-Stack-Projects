import { Url } from "./url.model.js";

import rateLimit from "express-rate-limit"; 

export async function  checkUrlOwner (req, res, next) {
    try {

        const { id } = req.params;

        if (!id) {
            return res.status(400).json({
                message: "Id/Slug is required"
            });
        }

        const url = await Url.findOne({ shortcode: id });

        if (!url) {
            return res.status(404).json({
                message: "Short url not found"
            });
        }

        if (!url.user || url.user.toString() !== req.user.id) {
            return res.status(403).json({ message: "Forbidden: You are not the owner of this URL" });
        }

        req.urlDoc = url;
        next();

    } catch (error) {
        return res.status(500).json({
            message: "Middleware error",
            error: error.message
        });
    }
}

export const createUrlLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15min
    limit: 50, // limit each IP to 100 req per 'window' => means one device can only send 100 req in 15 min
    standardHeaders: 'draft-8', // adds RateLimit-* headers to the response
    /*
        sends back RateLimit-Limit, RateLimit-Remaining, RateLimit-Reset headers
        so the client (your React frontend, or Postman)
        can see how close it is to the limit.
        Good practice, keep it on.
    */
    legacyHeaders: false, // disables the older X-RateLimit-* headers
    message: {
        message: "Too many URLs created from this IP, please try again after a minute"
    }
});
