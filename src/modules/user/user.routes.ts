import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { userController } from "./user.controller";
import {
  updateUserStatusSchema,
  updateUserRoleSchema,
} from "./user.validation";

export const userRouter = Router();

// All routes in this module require ADMIN role
userRouter.use(auth("ADMIN"));

// 1. Get all users (search, filter, pagination)
userRouter.get(
  "/",
  userController.getAllUsers,
);

// 2. Get user by ID
userRouter.get(
  "/:id",
  userController.getUserById,
);

// 3. Update user status (ACTIVE | BLOCKED)
userRouter.patch(
  "/:id/status",
  validate(updateUserStatusSchema),
  userController.updateUserStatus,
);

// 4. Update user role (USER | SURVEYOR | ADMIN)
userRouter.patch(
  "/:id/role",
  validate(updateUserRoleSchema),
  userController.updateUserRole,
);

// 5. Delete user
userRouter.delete(
  "/:id",
  userController.deleteUser,
);

