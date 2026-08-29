import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.email().trim().toLowerCase(),
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: z.email().trim().toLowerCase(),
  password: z.string().min(1).max(72),
});

export const verifyEmailSchema = z.object({
  email: z.email().trim().toLowerCase(),
  otp: z.string().regex(/^\d{6}$/, 'OTP must be 6 digits'),
});

export const resendOtpSchema = z.object({
  email: z.email().trim().toLowerCase(),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});

export const exchangeSchema = z.object({
  code: z.string().min(1),
});

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(100).optional(),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid phone number.")
    .optional(),
  whatsappNumber: z.string().optional(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
