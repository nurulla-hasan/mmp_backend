import { z } from "zod";

export const getUsersQuerySchema = z.object({
  searchTerm: z.string().optional(),
  role: z.enum(["USER", "SURVEYOR", "ADMIN"]).optional(),
  status: z.enum(["ACTIVE", "BLOCKED"]).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["newest", "oldest", "name_asc", "name_desc"]).default("newest"),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["ACTIVE", "BLOCKED"], {
    error: "Status must be either ACTIVE or BLOCKED",
  }),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["USER", "SURVEYOR", "ADMIN"], {
    error: "Role must be USER, SURVEYOR, or ADMIN",
  }),
});

export type GetUsersQueryInput = z.infer<typeof getUsersQuerySchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

