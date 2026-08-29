import { z } from "zod";

export const createDistrictSchema = z.object({
  name: z.string().trim().min(1, "District name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers or dashes."),
});

export type CreateDistrictInput = z.infer<typeof createDistrictSchema>;

export const createUpazilaSchema = z.object({
  name: z.string().trim().min(1, "Upazila name is required."),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers or dashes."),
  districtId: z.string().min(1, "District id is required."),
});

export type CreateUpazilaInput = z.infer<typeof createUpazilaSchema>;

export const updateDistrictSchema = z.object({
  name: z.string().trim().min(1, "District name is required.").optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers or dashes.")
    .optional(),
});

export type UpdateDistrictInput = z.infer<typeof updateDistrictSchema>;

export const updateUpazilaSchema = z.object({
  name: z.string().trim().min(1, "Upazila name is required.").optional(),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required.")
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers or dashes.")
    .optional(),
  districtId: z.string().min(1, "District id is required.").optional(),
});

export type UpdateUpazilaInput = z.infer<typeof updateUpazilaSchema>;
