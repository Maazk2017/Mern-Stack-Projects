import { z } from "zod";

export const createUrlSchema = z.object({
    originalurl: z
        .string()
        .url(),
    
    expireat: z
        .string()
        .datetime()
        .optional(),
    
    customslug: z
        .string()
        .min(3)
        .max(20)
        .regex(/^[a-zA-Z0-9-_]+$/)
        .optional()
});