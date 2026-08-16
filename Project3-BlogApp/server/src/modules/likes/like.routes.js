import express from "express";
import { verifyJWT } from "../auth/auth.middleware.js";
import { getLikers, toggleLike, toggleLikeComment } from "./likes.controller.js";

const router = express.Router();

// for posts
router.post("/:id/like", verifyJWT, toggleLike);
router.get("/:id/likes", getLikers);
// for comments
router.post("/:id/like", verifyJWT, toggleLikeComment);

export default router;