import mongoose from "mongoose";
import uploadFile from "./post.service.js";

import { Post } from "./post.model.js";
import { Comments } from "../comments/comments.model.js";
import { Likes } from "../likes/likes.model.js";

export async function createPost (req, res) {
    try {

        const {title, content} = req.body;
        
        if (!title && !content && (!req.file || req.files.length === 0)) {
            return res.status(400).json({
                message: "Post must include at least one of title, content, or an image"
            });
        }

        let images = [];

        if (req.files && req.files.length > 0) {
            const uploadResults = await Promise.all(
                req.files.map((file) => uploadFile(file.buffer.toString("base64")))
            );
            images = uploadResults.map((result) => result.url);
        }

        const post = await Post.create({
            title,
            content,
            images,
            author: req.user.id
        });

        return res.status(201).json({
            message: "Post created successfully",
            post
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

export async function getPostById (req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "Invalid post id"
            });
        }

        const post = await Post.findOne({_id:id, isDeleted: false}).populate("author", "username");

        if (!post) {
            return res.status(404).json({
                message: "Post not found"
            });
        }

        
        const [likesCount, commentsCount] = await Promise.all([
            Likes.countDocuments({post: id}),
            Comments.countDocuments({post: id, isDeleted: false})
        ]);

        return res.status(200).json({
            message: "Post fetched successfully",
            post,
            likesCount,
            commentsCount
        });


    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

export async function getPosts (req, res) {
    try {   
        const limit = Math.min(Number(req.query.limit) || 10, 20);

        const cursor = req.query.cursor;

        const query = { isDeleted: false };

        if (cursor) {
           if (!mongoose.Types.ObjectId.isValid(cursor)) {
                return res.status(400).json({
                    message: "Invalid cursor"
                });
           } 
           query._id = {$lt: cursor}
        }

        const posts = await Post.find(query) 
            .sort({_id: -1})
            .limit(limit + 1)
            .populate("author", "username")
            .lean();

        const hasMore = posts.length > limit;
        const results = hasMore ? posts.slice(0, -1) : posts
        const nextCursor = hasMore ? results[results.length -1]._id : null;

        return res.status(200).json({
            message: "Post fetched successfully",
            posts: results,
            nextCursor,
            hasMore
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

export async function updatePost (req, res) {
    try {
        const { title, content } = req.body;
        const post = req.post;

        if (!title && !content && (!req.files || req.files.length === 0)) {
            return res.status(400).json({
                message: "Post must include at least one of title, content, or an image"
            });
        }

        if (req.files && req.files.length > 0) {
            const uploadResults = await Promise.all(
                req.files.map((file) => uploadFile(file.buffer.toString("base64")))
            );
            post.images = uploadResults.map((result) => result.url);
        }

        if (title !== undefined) post.title = title;
        if (content !== undefined) post.content = content;

        await post.save();

        return res.status(200).json({
            message: "Post updated successfully",
            post
        });

    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

export async function deletePost (req, res) {
    try {
        const post = req.post;
        
        post.isDeleted = true;
        await post.save();
        
        return res.status(200).json({
            message: "Post deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            message: "Something went wrong",
            error: error.message,
        });
    }
}

