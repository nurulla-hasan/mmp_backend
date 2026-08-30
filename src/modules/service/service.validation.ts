import { z } from "zod";

export const createServiceSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase alphanumeric characters and hyphens.",
    ),
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional().nullable(),
});

export const updateServiceSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can only contain lowercase alphanumeric characters and hyphens.",
    )
    .optional(),
  name: z.string().min(2, "Name must be at least 2 characters.").optional(),
  description: z.string().optional().nullable(),
});

export const getServicesQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
  searchTerm: z.string().optional(),
  sortBy: z
    .enum(["newest", "oldest", "name_asc", "name_desc"])
    .optional()
    .default("newest"),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type GetServicesQueryInput = z.infer<typeof getServicesQuerySchema>;
