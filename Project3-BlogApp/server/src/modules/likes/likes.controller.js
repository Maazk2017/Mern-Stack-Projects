import mongoose from "mongoose";

import { Post } from "../post/post.model.js";
import { Likes } from "./likes.model.js";
import { Comments } from "../comments/comments.model.js";

export async function toggleLike(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findOne({ _id: id, isDeleted: false });

        if (!post) {
            return res.status(404).json({
                message: "Post does not exists"
            });
        }

        const existingLike = await Likes.findOne({ targetType: "Post", target: post._id, user: req.user.id });

        let liked;
        if (existingLike) {
            await existingLike.deleteOne();
            liked = false;
        } else {
            try {
                await Likes.create({
                    targetType: "Post",
                    target: post._id,
                    user: req.user.id
                });
                liked = true;
            } catch (error) {
                return res.status(500).json({
                    message: "Something went wrong",
                    error: error.message
                });
            }

        }

        const likeCount = await Likes.countDocuments({ targetType: "Post", target: post._id });

        return res.status(200).json({
            message: liked ? "Post liked" : "Post unliked",
            liked,
            likeCount
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }

}

export async function getLikers(req, res) {
    try {

        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findOne({ _id: id, isDeleted: false });

        if (!post) {
            return res.status(404).json({
                message: "Post does not exists"
            });
        }

        const limit = Math.min(Number(req.query.limit) || 10, 20);
        const cursor = req.query.cursor;
        const query = { targetType: "Post", target: id };

        if (cursor) {
            if (!mongoose.Types.ObjectId.isValid(cursor)) {
                return res.status(400).json({
                    message: "Invalid cursor"
                });
            }
            query._id = { $lt: cursor };
        }

        const likes = await Likes.find(query)
            .sort({ _id: -1 })
            .limit(limit + 1)
            .populate("user", "username")
            .lean();

        const hasMore = likes.length > limit;
        const results = hasMore ? likes.slice(0, -1) : likes;
        const nextCursor = hasMore ? results[results.length - 1]._id : null;

        return res.status(200).json({
            message: "Likers fetched successfully",
            likers: results.map((like) => like.user),
            nextCursor,
            hasMore
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function toggleLikeComment(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid comment id"
            });
        }

        const comment = await Comments.findOne({ _id: id, isDeleted: false });

        if (!comment) {
            return res.status(404).json({
                message: "Comment does not exists"
            });
        }

        const existingLike = await Likes.findOne({ targetType: "Comments", target: comment._id, user: req.user.id });

        let liked;
        if (existingLike) {
            liked = true;
            await existingLike.deleteOne();
        } else {
            try {
                await Likes.create({
                    targetType: "Comments",
                    target: comment._id,
                    user: req.user.id
                });
                liked = true;
            } catch (error) {
                return res.status(500).json({
                    message: "Something went wrong",
                    error: error.message
                });
            }
        }

        const likeCount = await Likes.countDocuments({  targetType: "Comments", target: comment._id });

        return res.status(200).json({
            message: liked ? "Comment liked" : "Comment unliked",
            liked,
            likeCount
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }

}