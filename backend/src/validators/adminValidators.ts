import { z } from "zod";

export const setUserActiveSchema = z.object({
  body: z.object({
    active: z.boolean(),
  }),
});

export const processWithdrawalSchema = z.object({
  body: z.object({
    action: z.enum(["complete", "reject"]),
  }),
});
