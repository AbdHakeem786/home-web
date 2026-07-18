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

export const creditWalletSchema = z.object({
  body: z.object({
    amount: z.coerce.number().min(1).max(100000),
    label: z.string().trim().min(3).max(150).optional(),
  }),
});
