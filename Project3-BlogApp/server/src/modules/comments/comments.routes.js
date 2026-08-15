import express from "express";

import { createComment, deleteComment, getComments, updateComment } from "./comments.controller.js";
import { verifyJWT } from "../auth/auth.middleware.js"; 
import { checkCommentOwner } from "../utils/comment.utils.js";
import { createCommentsSchema, updateCommentsSchema } from "./comments.validation.js";
import { validate } from "../auth/auth.middleware.js";

const router = express.Router();

router.get("/:postId/comments", getComments);
router.post("/:postId/comments", verifyJWT, validate(createCommentsSchema), createComment);

export default router;
