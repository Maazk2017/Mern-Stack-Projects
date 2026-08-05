import express from "express";
import { validate, verifyJWT } from "./auth.middleware.js";
import { login, registerUser, logout, refreshToken, getMe } from "./auth.controller.js";
import { loginSchema, registerSchema } from "./user.validation.js";

const router = express.Router();

router.post("/register", validate(registerSchema), registerUser);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);

router.get("/refreshToken", refreshToken);
router.get("/getMe", verifyJWT, getMe);

export default router;