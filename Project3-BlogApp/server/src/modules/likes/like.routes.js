import express from "express";

const router = express.Router();

router.post("/:postId/like");
router.get("/:postId/likes");

export default router;