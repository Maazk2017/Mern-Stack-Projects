import mongoose from "mongoose";

import { Comments } from "./comments.model.js";
import { Post } from "../post/post.model.js";
import { Likes } from "../likes/likes.model.js";

export async function getComments (req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findOne({_id: id, isDeleted: false});

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        const limit = Math.min(Number(req.query.limit) || 10, 20);
        const cursor = req.query.cursor;
        const query = { post: id };

        if (cursor) {
            if (!mongoose.Types.ObjectId.isValid(cursor)) {
                return res.status(400).json({
                    message: "Invalid cursor"
                });
            }
            query._id = { $gt: cursor };
        }

        const comments = await Comments.find(query)
            .sort({ _id: 1 })
            .limit(limit + 1)
            .populate("author", "username")
            .lean();

        const hasMore = comments.length > limit;
        const trimmed = hasMore ? comments.slice(0, -1) : comments;
        const nextCursor = hasMore ? trimmed[trimmed.length - 1]._id : null;

        const commentIds = trimmed.map((c) => c._id);
        const likeCounts = await Likes.aggregate([
            { $match: {targetType: "Comments", target: { $in: commentIds }} },
            { $group: {_id: "$target", count: {$sum: 1}} }
        ]);

        const countMap = new Map(likeCounts.map((lc) => [lc._id.toString(), lc.count]));

        const results = trimmed.map((c) => ({
            ...(c.isDeleted ? { ...c, text: null } : c),
            likeCount: countMap.get(c._id.toString()) || 0
        }));
        
        return res.status(200).json({
            message: "Comments fetched successfully",
            comments: results,
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

export async function createComment (req, res) {
    try {
        const { id, parentComment } = req.params;
        const { text } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findOne({_id: id, isDeleted: false});

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        if (parentComment) {
            if (!mongoose.Types.ObjectId.isValid(parentComment)) {
                return res.status(400).json({ message: "Invalid parent comment id" });
            }
            const parent = await Comments.findOne({_id: parentComment, isDeleted: false});
            if (!parent) {
                return res.status(404).json({ message: "Parent comment not found" });
            }
        }

        const comment = await Comments.create({
            text,
            post: post._id,
            author: req.user.id,
            parentComment: parentComment || null
        });

        return res.status(201).json({
            message: "Comment posted successfully",
            comment
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function updateComment (req, res) {
    try {
        const { text } = req.body;
        const comment = req.comment;

        comment.text = text;
        await comment.save();

        return res.status(200).json({
            message: "Comment updated successfully",
            comment
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}

export async function deleteComment (req, res) {
    try {

        const comment = req.comment;
        
        comment.isDeleted = true;
        await comment.save();

        return res.status(200).json({
            message: "Comment deleted successfully"
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message
        });
    }
}