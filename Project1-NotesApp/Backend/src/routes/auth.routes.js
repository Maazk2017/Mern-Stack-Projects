import express from "express";

import { registerUser, login, logout, refreshToken, getMe } from "../controllers/auth.controllers.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", login);
router.post("/logout", logout);
router.post("/refreshToken", refreshToken);
router.get("/getMe", verifyJWT, getMe);

export default router;