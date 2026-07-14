import { z } from "zod";

export const listWorkersSchema = z.object({
  body: z.object({}).optional(),
  query: z.object({
    category: z.string().optional(),
    online: z.enum(["true", "false"]).optional(),
    verified: z.enum(["true", "false"]).optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    search: z.string().trim().min(1).max(100).optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    sort: z.enum(["distance", "rating", "price", "experience"]).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});

export const createWorkerProfileSchema = z.object({
  body: z.object({
    category: z.string().min(1),
    bio: z.string().max(1000).optional().default(""),
    priceFrom: z.coerce.number().min(0),
    experienceYears: z.coerce.number().min(0).optional().default(0),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    skills: z.array(z.string()).optional(),
    cnicImage: z.string().optional(),
    documents: z.array(z.string()).optional(),
  }),
});

export const updateWorkerProfileSchema = z.object({
  body: z.object({
    category: z.string().min(1).optional(),
    bio: z.string().max(1000).optional(),
    priceFrom: z.coerce.number().min(0).optional(),
    experienceYears: z.coerce.number().min(0).optional(),
    online: z.boolean().optional(),
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    skills: z.array(z.string()).optional(),
    cnicImage: z.string().optional(),
    documents: z.array(z.string()).optional(),
  }),
});

export const updateLocationSchema = z.object({
  body: z.object({
    lat: z.coerce.number(),
    lng: z.coerce.number(),
    bookingId: z.string().optional(),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    online: z.boolean(),
  }),
});

const timeOfDay = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use 24h HH:mm format");

export const updateScheduleSchema = z.object({
  body: z.object({
    schedule: z
      .array(
        z
          .object({
            day: z.coerce.number().int().min(0).max(6),
            startTime: timeOfDay,
            endTime: timeOfDay,
          })
          .refine((s) => s.startTime < s.endTime, {
            message: "startTime must be before endTime",
            path: ["endTime"],
          })
      )
      .max(50),
  }),
});
