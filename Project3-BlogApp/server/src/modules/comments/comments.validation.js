import { z } from "zod";

export const createCommentsSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Comment text is required")
});

export const updateCommentsSchema = z.object({
    text: z
        .string()
        .trim()
        .min(1, "Comment text is required")
});