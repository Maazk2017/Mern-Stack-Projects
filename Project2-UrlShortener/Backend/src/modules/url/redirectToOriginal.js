import express from "express";
import { redirectToOriginal } from "../url/url.controller.js";

const router = express.Router();
router.get("/:slug", redirectToOriginal);

export default router;