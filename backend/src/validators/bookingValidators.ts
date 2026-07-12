import { z } from "zod";
import { BOOKING_STATUSES } from "../types";

export const createBookingSchema = z.object({
  body: z.object({
    workerId: z.string().min(1),
    categoryId: z.string().min(1),
    date: z.string().min(1),
    time: z.string().min(1),
    address: z.string().min(3).max(300),
    description: z.string().max(1000).optional().default(""),
    estimatedPrice: z.coerce.number().min(0),
    problemImages: z.array(z.string()).max(6).optional().default([]),
    paymentMethod: z.enum(["cash", "stripe"]).optional().default("cash"),
  }),
});

export const updateBookingStatusSchema = z.object({
  body: z.object({
    status: z.enum(BOOKING_STATUSES as [string, ...string[]]),
    cancelReason: z.string().max(300).optional(),
    finalPrice: z.coerce.number().min(0).optional(),
    completionImages: z.array(z.string()).max(6).optional(),
  }),
});

export const rescheduleBookingSchema = z.object({
  body: z.object({
    date: z.string().min(1),
    time: z.string().min(1),
  }),
});

export const listBookingsSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    status: z.enum(BOOKING_STATUSES as [string, ...string[]]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
