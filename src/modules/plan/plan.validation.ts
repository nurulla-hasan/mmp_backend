import { z } from "zod";

export const createPlanSchema = z.object({
  name: z.string().min(2, "Plan name must be at least 2 characters."),
  code: z.string().min(2, "Plan code is required (e.g. pro_monthly)."),
  description: z.string().optional().default(""),
  price: z.coerce.number().min(0, "Price must be greater than or equal to 0."),
  originalPrice: z.coerce.number().min(0).optional().nullable(),
  discountBadge: z.string().optional().nullable(),
  durationDays: z.coerce.number().int().positive("Duration must be a positive integer.").default(30),
  billingCycle: z.enum(["MONTHLY", "SIX_MONTHS", "YEARLY", "LIFETIME", "CUSTOM"]).default("MONTHLY"),
  tools: z.array(z.string()).default([]),
  features: z.array(z.string()).default([]),
  isPopular: z.boolean().default(false),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().default(0),
});

export const updatePlanSchema = createPlanSchema.partial();

export const getPlansQuerySchema = z.object({
  searchTerm: z.string().optional(),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  sortBy: z.enum(["sortOrder", "price_asc", "price_desc", "newest"]).default("sortOrder"),
});

export type CreatePlanInput = z.infer<typeof createPlanSchema>;
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
export type GetPlansQueryInput = z.infer<typeof getPlansQuerySchema>;
