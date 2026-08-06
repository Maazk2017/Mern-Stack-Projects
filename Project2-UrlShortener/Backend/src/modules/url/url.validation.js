import { z } from "zod";

export const createUrlSchema = z.object({
    originalurl: z
        .string()
        .url()
});