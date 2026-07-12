import { z } from "zod";

export const subscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().min(1).url(),
    keys: z.object({
      p256dh: z.string().min(1),
      auth: z.string().min(1),
    }),
  }),
});

export const unsubscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().min(1).url(),
  }),
});
