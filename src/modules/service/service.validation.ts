import { z } from "zod";

export const createServiceSchema = z.object({
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers and hyphens."),
  name: z.string().min(2, "Name must be at least 2 characters."),
  description: z.string().optional(),
});

export const updateServiceSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
