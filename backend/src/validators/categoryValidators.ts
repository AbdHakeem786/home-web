import { z } from "zod";

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60),
    icon: z.string().trim().min(1).max(60),
  }),
});

export const updateCategorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    icon: z.string().trim().min(1).max(60).optional(),
    active: z.boolean().optional(),
  }),
});
