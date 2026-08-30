import { z } from "zod";

export const createBroadcastSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters."),
  message: z.string().min(5, "Message must be at least 5 characters."),
  type: z.enum(["INFO", "WARNING", "PROMO", "MAINTENANCE"]).default("INFO"),
  target: z.enum(["ALL", "USERS", "SURVEYORS", "PRO_USERS"]).default("ALL"),
  linkUrl: z.string().optional().nullable(),
  linkText: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().optional().nullable(),
});

export const updateBroadcastSchema = createBroadcastSchema.partial();

export const getBroadcastsQuerySchema = z.object({
  searchTerm: z.string().optional(),
  type: z.enum(["ALL", "INFO", "WARNING", "PROMO", "MAINTENANCE"]).optional().default("ALL"),
  target: z.enum(["ALL", "USERS", "SURVEYORS", "PRO_USERS"]).optional().default("ALL"),
  isActive: z.enum(["true", "false", "all"]).optional().default("all"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["newest", "oldest", "pinned"]).default("newest"),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type UpdateBroadcastInput = z.infer<typeof updateBroadcastSchema>;
export type GetBroadcastsQueryInput = z.infer<typeof getBroadcastsQuerySchema>;

