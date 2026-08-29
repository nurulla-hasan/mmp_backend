import { z } from "zod";

const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

export const plotInputSchema = z.object({
  plotNumber: z.string().min(1, "Plot number/name is required"),
  points: z.array(pointSchema).min(3, "At least 3 points required for a polygon"),
  areaSqLink: z.coerce.number().optional().default(0),
  areaShotok: z.coerce.number().optional().default(0),
  areaKatha: z.coerce.number().optional().default(0),
});

export const createCalculationSchema = z.object({
  name: z.string().min(1, "Calculation name is required"),
  mapName: z.string().optional().nullable(),
  scaleType: z.string().optional().default("link"),
  scalePxPerUnit: z.coerce.number().optional().nullable(),
  imageWidth: z.coerce.number().optional().nullable(),
  imageHeight: z.coerce.number().optional().nullable(),
  plots: z.array(plotInputSchema).min(1, "At least one plot is required to save"),
});

export const updateCalculationSchema = z.object({
  name: z.string().min(1).optional(),
  mapName: z.string().optional().nullable(),
  scaleType: z.string().optional(),
  scalePxPerUnit: z.coerce.number().optional().nullable(),
  imageWidth: z.coerce.number().optional().nullable(),
  imageHeight: z.coerce.number().optional().nullable(),
  plots: z.array(plotInputSchema).optional(),
});

export type CreateCalculationInput = z.infer<typeof createCalculationSchema>;
export type UpdateCalculationInput = z.infer<typeof updateCalculationSchema>;
