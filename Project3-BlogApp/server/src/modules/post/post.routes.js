import express from "express";
import multer from "multer";

import { validate, verifyJWT } from "../auth/auth.middleware.js";
import { checkPostOwner } from "../utils/post.utils.js";
import { createPost, deletePost, getPostById, getPosts, updatePost } from "./post.controller.js";
import { createPostSchema, updateSchema } from "./post.validation.js";

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // limits 5MB per file
    }
});

const router = express.Router();


// reads are public - anyone can browse them
router.get("/", getPosts);
router.get("/:id", getPostById);

router.post("/", verifyJWT, upload.array("images", 5), validate(createPostSchema), createPost);
router.patch("/:id", verifyJWT, checkPostOwner, upload.array("images"), validate(updateSchema), updatePost);
router.delete("/:id", verifyJWT, checkPostOwner, deletePost);

export default router;

