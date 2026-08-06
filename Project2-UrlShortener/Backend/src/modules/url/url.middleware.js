import { Url } from "./url.model.js";

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