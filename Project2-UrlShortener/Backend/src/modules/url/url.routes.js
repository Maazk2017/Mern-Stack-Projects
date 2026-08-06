import express from "express";
import { createShortUrl, redirectToOriginal, getStats, deleteSlug, getAllSlugs } from "./url.controller.js";
import { validate, verifyJWT } from "../auth/auth.middleware.js";
import { createUrlSchema } from "./url.validation.js";
import { checkUrlOwner } from "./url.middleware.js";

const router = express.Router();

router.post("/urls", verifyJWT, validate(createUrlSchema), createShortUrl);
router.get("/urls/:id/stats", verifyJWT, checkUrlOwner, getStats);

router.get("/urls", verifyJWT, getAllSlugs);
router.delete("/urls/:id", verifyJWT, checkUrlOwner, deleteSlug);

router.get("/:slug", redirectToOriginal);

export default router;