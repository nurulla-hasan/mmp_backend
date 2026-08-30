import { z } from "zod";

export const createSubscriptionSchema = z.object({
  userId: z.string().min(1, "User ID is required."),
  planId: z.string().min(1, "Plan ID is required."),
  durationDays: z.coerce.number().int().positive().optional(),
  endDate: z.string().optional(),
  paymentMethod: z.string().default("MANUAL"),
  transactionId: z.string().optional().default(""),
  amountPaid: z.coerce.number().default(0),
  adminNote: z.string().optional().default(""),
});

export const updateSubscriptionSchema = z.object({
  planId: z.string().optional(),
  status: z.enum(["ACTIVE", "EXPIRED", "CANCELLED", "PENDING"]).optional(),
  endDate: z.string().optional(),
  adminNote: z.string().optional(),
});

export const extendSubscriptionSchema = z.object({
  days: z.coerce.number().int().positive("Days must be a positive integer."),
});

export const getSubscribersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(["ALL", "ACTIVE", "EXPIRED", "CANCELLED", "PENDING"]).optional().default("ALL"),
  planId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["newest", "oldest", "expires_soon", "expires_latest"]).default("newest"),
});

export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type ExtendSubscriptionInput = z.infer<typeof extendSubscriptionSchema>;
export type GetSubscribersQueryInput = z.infer<typeof getSubscribersQuerySchema>;

