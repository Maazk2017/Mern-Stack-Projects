import express from "express";

import { validate, verifyJWT } from "../auth/auth.middleware.js";
import { checkCommentOwner } from "../utils/comment.utils.js";
import { updateCommentsSchema } from "./comments.validation.js";
import { updateComment, deleteComment } from "./comments.controller.js";

const router = express.Router();

router.patch("/:id", verifyJWT, checkCommentOwner, validate(updateCommentsSchema), updateComment);
router.delete("/:id", verifyJWT, checkCommentOwner, deleteComment);

export default router;