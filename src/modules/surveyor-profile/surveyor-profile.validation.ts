import { z } from "zod";

export const applyAsSurveyorSchema = z.object({
  headline: z.string().min(3, "Headline is required."),
  bio: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).default(0),
  serviceAreas: z
    .array(
      z.object({
        district: z.string().min(1, "District is required."),
        upazilas: z.array(z.string()).default([]),
      }),
    )
    .min(1, "At least one service area is required."),
  services: z
    .array(
      z.object({
        serviceId: z.string().min(1, "Service ID is required."),
        startingPrice: z.coerce.number().min(0, "Starting price cannot be negative."),
      }),
    )
    .min(1, "At least one service is required."),
});

export const updateSurveyorProfileSchema = z.object({
  headline: z.string().min(3).optional(),
  bio: z.string().optional(),
  experienceYears: z.coerce.number().int().min(0).optional(),
  serviceAreas: z
    .array(
      z.object({
        district: z.string().min(1, "District is required."),
        upazilas: z.array(z.string()).default([]),
      }),
    )
    .optional(),
  services: z
    .array(
      z.object({
        serviceId: z.string().min(1, "Service ID is required."),
        startingPrice: z.coerce.number().min(0, "Starting price cannot be negative."),
      }),
    )
    .optional(),
});

export const verifySurveyorSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().optional(),
});

export type ApplyAsSurveyorInput = z.infer<typeof applyAsSurveyorSchema>;
export type UpdateSurveyorProfileInput = z.infer<typeof updateSurveyorProfileSchema>;
export type VerifySurveyorInput = z.infer<typeof verifySurveyorSchema>;
