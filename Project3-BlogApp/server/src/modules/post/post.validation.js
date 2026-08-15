import { z } from "zod";

export const createPostSchema = z.object({
    title: z
        .string()
        .trim()
        .optional(),

    content: z
        .string()
        .trim()
        .optional()
});

export const updateSchema = z.object({
    title: z
        .string()
        .trim()
        .optional(),

    content: z
        .string()
        .trim()
        .optional()
});