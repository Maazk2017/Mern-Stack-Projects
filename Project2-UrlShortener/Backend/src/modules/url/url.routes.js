import express from "express";

import { createShortUrl, redirectToOriginal, getStats, deleteSlug, getAllSlugs } from "./url.controller.js";
import { validate, verifyJWT } from "../auth/auth.middleware.js";
import { createUrlSchema } from "./url.validation.js";
import { checkUrlOwner, createUrlLimiter } from "./url.middleware.js";



const router = express.Router();

/*

    I put createUrlLimiter before validate. 
    Why? Rate limiting should be as cheap and early as possible — you want to reject abusive traffic before spending effort parsing/validating their body. 
    If someone's hammering your endpoint with garbage, you want to slam the door immediately, 
    not validate their garbage first.

*/

router.post("/urls", verifyJWT, createUrlLimiter, validate(createUrlSchema), createShortUrl);
router.get("/urls/:id/stats", verifyJWT, checkUrlOwner, getStats);

router.get("/urls", verifyJWT, getAllSlugs);
router.delete("/urls/:id", verifyJWT, checkUrlOwner, deleteSlug);

router.get("urls/:slug", redirectToOriginal);

export default router;