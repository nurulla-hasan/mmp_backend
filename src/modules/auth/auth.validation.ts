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

const bdPhoneRegex = /^(?:\+?88)?01[3-9]\d{8}$/;

export const updateMeSchema = z.object({
  name: z.string().trim().min(2, "Name is too short.").max(100).optional(),
  phone: z
    .string()
    .trim()
    .regex(bdPhoneRegex, "Invalid phone number.")
    .or(z.literal(""))
    .optional(),
  whatsappNumber: z
    .string()
    .trim()
    .regex(bdPhoneRegex, "Invalid WhatsApp number.")
    .or(z.literal(""))
    .optional(),
  district: z.string().optional(),
  upazila: z.string().optional(),
  imageUrl: z.string().trim().url("Invalid image URL.").or(z.literal("")).optional(),
});

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().optional(),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters.")
      .max(72),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password do not match.",
    path: ["confirmPassword"],
  })
  .refine((data) => !data.oldPassword || data.oldPassword !== data.newPassword, {
    message: "New password cannot be the same as current password.",
    path: ["newPassword"],
  });

export const forgotPasswordSchema = z.object({
  email: z.email("Please provide a valid email address.").trim().toLowerCase(),
});

export const resetPasswordSchema = z
  .object({
    email: z.email("Please provide a valid email address.").trim().toLowerCase(),
    otp: z.string().regex(/^\d{6}$/, "Verification code must be 6 digits."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(72),
    confirmPassword: z.string().min(1, "Please confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const resendResetOtpSchema = z.object({
  email: z.email("Please provide a valid email address.").trim().toLowerCase(),
});

export type UpdateMeInput = z.infer<typeof updateMeSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
