import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { userController } from "./user.controller";
import {
  createAdminSchema,
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "./user.validation";

export const userRouter = Router();

// 1. Get all users (Admin & Super Admin)
userRouter.get("/", auth("ADMIN"), userController.getAllUsers);

// 2. Get user by ID (Admin & Super Admin)
userRouter.get("/:id", auth("ADMIN"), userController.getUserById);

// 3. Create new Admin (Super Admin only)
userRouter.post(
  "/create-admin",
  auth("SUPER_ADMIN"),
  validate(createAdminSchema),
  userController.createAdmin,
);

// 4. Update user status (Admin & Super Admin)
userRouter.patch(
  "/:id/status",
  auth("ADMIN"),
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

// 5. Update user role (Super Admin only)
userRouter.patch(
  "/:id/role",
  auth("SUPER_ADMIN"),
  validate(updateUserRoleSchema),
  userController.updateUserRole,
);

// 6. Delete user (Super Admin only)
userRouter.delete("/:id", auth("SUPER_ADMIN"), userController.deleteUser);
