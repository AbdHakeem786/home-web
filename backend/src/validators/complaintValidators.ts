import { z } from "zod";

export const createComplaintSchema = z.object({
  body: z.object({
    bookingId: z.string().optional(),
    subject: z.string().trim().min(3).max(150),
    description: z.string().trim().min(5).max(2000),
  }),
});

export const updateComplaintSchema = z.object({
  body: z.object({
    status: z.enum(["open", "in_review", "resolved", "rejected"]),
    adminNote: z.string().max(1000).optional(),
  }),
});
