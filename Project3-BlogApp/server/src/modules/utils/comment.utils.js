import mongoose from "mongoose";

import { Comments } from "../comments/comments.model.js";

export async function checkCommentOwner (req, res, next) {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment id"
            });
        }

        const comment = await Comments.findOne({_id: id, isDeleted: false});
        if (!comment) {
            return res.status(404).json({
                message: "Comment not found"
            });
        }

        if (comment.author.toString() !== req.user.id) {
            return res.status(403).json({
                message: "You dont have permission to edit this comment"
            });
        }

        req.comment = comment;
        next();
    } catch (error) {
        next(error);
    }
} 