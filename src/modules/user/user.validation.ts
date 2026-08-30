import { z } from "zod";

export const getUsersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  role: z.enum(["USER", "SURVEYOR", "ADMIN", "SUPER_ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z
    .enum(["newest", "oldest", "name_asc", "name_desc"])
    .default("newest"),
});

export const createAdminSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Phone number must be an 11-digit valid number.")
    .optional()
    .nullable(),
  role: z.enum(["ADMIN", "SUPER_ADMIN"]).optional().default("ADMIN"),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], {
    error: "Status must be either ACTIVE or BLOCKED",
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "SURVEYOR", "ADMIN", "SUPER_ADMIN"], {
    error: "Role must be USER, SURVEYOR, ADMIN, or SUPER_ADMIN",
  }),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type CreateAdminInput = z.infer<typeof createAdminSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
