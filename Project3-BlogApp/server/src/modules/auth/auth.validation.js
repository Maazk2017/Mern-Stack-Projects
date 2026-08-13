import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be atleast 3 characters")
        .max(15, "Username must be no more than 15 characters")
        .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
    
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email"),
    
    password: z
        .string()
        .min(8, "Password must be atleast 8 characters")
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email"),

    password: z
        .string()
        .min(8, "Password must be atleast 8 characters")
});

export const verifyOtpSchema = z.object({
    userId: z
        .string()
        .regex(/^[0-9a-fA-F]{24}$/, "Invalid User ID format"),
    
    otp: z 
        .string()
        .trim()
        .length(6, "OTP must be exactly 6 digits")
        .regex(/^\d+$/, "OTP must contain only numbers")
});

export const resendOtpSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .email("Invalid email address")
});