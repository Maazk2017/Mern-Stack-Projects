import mongoose from "mongoose";

import { Post } from "../post/post.model.js";

export async function checkPostOwner (req, res, next) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({ message: "Post not found" });
        }

        if (post.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You dont have permission to modify this post"
            });
        }

        req.post = post;
        next();
    } catch (error) {
        next(error)
    }
    
}