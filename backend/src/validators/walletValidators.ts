import { z } from "zod";

export const withdrawalSchema = z.object({
  body: z.object({
    amount: z.coerce.number().min(1),
    method: z.string().trim().min(2).max(50),
    accountDetails: z.string().trim().min(3).max(100),
  }),
});
