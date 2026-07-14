import { z } from "zod";

const phoneSchema = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number (10-15 digits, optional +)");

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100),
    phone: phoneSchema,
    password: z.string().min(6).max(100),
    role: z.enum(["customer", "worker"]).optional().default("customer"),
    email: z.string().trim().email("A valid email is required to verify your account"),
    referralCode: z.string().trim().min(1).optional(),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    token: z.string().min(10),
  }),
});

export const resendVerificationEmailSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(10),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    password: z.string().min(1),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z.string().length(6),
    purpose: z.enum(["register", "login", "forgot_password"]),
  }),
});

export const resendOtpSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    purpose: z.enum(["register", "login", "forgot_password"]),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    phone: phoneSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    code: z.string().length(6),
    newPassword: z.string().min(6).max(100),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    email: z.string().trim().email().optional(),
    avatar: z.string().optional(),
  }),
});

export const addAddressSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(30),
    address: z.string().trim().min(3).max(300),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1).max(30).optional(),
    address: z.string().trim().min(3).max(300).optional(),
  }),
});
