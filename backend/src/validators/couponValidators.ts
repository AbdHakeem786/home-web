import { z } from "zod";

const createCouponBody = z
  .object({
    code: z.string().trim().min(3).max(30),
    type: z.enum(["percent", "flat"]),
    value: z.coerce.number().min(0),
    maxUses: z.coerce.number().int().min(1).optional(),
    perUserLimit: z.coerce.number().int().min(1).optional().default(1),
    minBookingAmount: z.coerce.number().min(0).optional().default(0),
    expiresAt: z.string().optional(),
  })
  .refine((d) => d.type !== "percent" || d.value <= 100, {
    message: "Percent discount cannot exceed 100",
    path: ["value"],
  });

export const createCouponSchema = z.object({ body: createCouponBody });

export const updateCouponSchema = z.object({
  body: z.object({
    active: z.boolean().optional(),
    maxUses: z.coerce.number().int().min(1).optional(),
    expiresAt: z.string().optional(),
  }),
});

export const validateCouponSchema = z.object({
  body: z.object({
    code: z.string().trim().min(1),
    amount: z.coerce.number().min(0),
  }),
});
