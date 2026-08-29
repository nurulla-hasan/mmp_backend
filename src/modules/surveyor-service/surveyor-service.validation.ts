import { z } from "zod";

export const addSurveyorServiceSchema = z.object({
  serviceId: z.string().min(1, "Service ID is required."),
  startingPrice: z.coerce.number().min(0, "Starting price cannot be negative."),
});

export const updateSurveyorServiceSchema = z.object({
  startingPrice: z.coerce.number().min(0, "Starting price cannot be negative."),
});

export type AddSurveyorServiceInput = z.infer<typeof addSurveyorServiceSchema>;
export type UpdateSurveyorServiceInput = z.infer<typeof updateSurveyorServiceSchema>;
