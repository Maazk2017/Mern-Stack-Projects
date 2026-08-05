import { z } from "zod";

export const registerSchema = z.object({
    username: z
        .string()
        .trim()
        .min(3, "Username must be atleast 3 characters")
        .max(20),

    email: z
        .string()
        .trim()
        .email("Invalid email"),
    
    password: z
        .string()
        .min(8, "Password must be atleast 8 characters")
        .max(100)
});

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Invalid email"),

    password: z 
        .string()
        .min(8, "Password must be atleast 8 characters")
});