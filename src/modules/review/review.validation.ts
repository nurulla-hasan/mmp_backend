import { z } from "zod";

export const createReviewSchema = z.object({
  surveyorProfileId: z.string().min(1, "Surveyor Profile ID is required."),
  serviceName: z.string().optional().nullable(),
  rating: z.coerce.number().int().min(1, "Rating must be between 1 and 5.").max(5, "Rating must be between 1 and 5."),
  comment: z.string().min(3, "Comment must be at least 3 characters."),
});

export const updateReviewStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED"], {
    error: "Status must be PENDING, APPROVED, or REJECTED.",
  }),
});

export const getReviewsQuerySchema = z.object({
  searchTerm: z.string().optional(),
  status: z.enum(["ALL", "PENDING", "APPROVED", "REJECTED"]).optional().default("ALL"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  surveyorProfileId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["newest", "oldest", "highest_rating", "lowest_rating"]).default("newest"),
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewStatusInput = z.infer<typeof updateReviewStatusSchema>;
export type GetReviewsQueryInput = z.infer<typeof getReviewsQuerySchema>;
