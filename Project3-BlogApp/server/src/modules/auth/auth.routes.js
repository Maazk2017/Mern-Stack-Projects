import express from "express";
import { validate, verifyJWT } from "./auth.middleware.js";
import { loginSchema, registerSchema, resendOtpSchema, verifyOtpSchema } from "./auth.validation.js";
import { register, login, logout, refreshToken, getMe, verifyOtp, resendOtp } from "./auth.controller.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.post("/refresh", refreshToken);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/resend-otp", validate(resendOtpSchema),  resendOtp);
router.post("/logout", verifyJWT, logout);
router.get("/getMe", verifyJWT, getMe);

export default router;
