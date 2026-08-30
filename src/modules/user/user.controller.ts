import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { userService } from "./user.service";
import { getUsersQuerySchema } from "./user.validation";

// 1. Get all users (Admin only, excluding current admin)
const getAllUsers = catchAsync(async (req, res) => {
  const query = getUsersQuerySchema.parse(req.query);
  const result = await userService.getAllUsers(query, req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Users retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 2. Get user by ID (Admin only)
const getUserById = catchAsync(async (req, res) => {
  const result = await userService.getUserById(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User details retrieved successfully.",
    data: result,
  });
});

// 3. Update user status (Admin only)
const updateUserStatus = catchAsync(async (req, res) => {
  const result = await userService.updateUserStatus(
    String(req.params.id),
    req.body,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User status updated successfully.",
    data: result,
  });
});

// 4. Update user role (Admin only)
const updateUserRole = catchAsync(async (req, res) => {
  const result = await userService.updateUserRole(
    String(req.params.id),
    req.body,
    req.user!.id,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User role updated successfully.",
    data: result,
  });
});

// 5. Delete user (Admin only)
const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUser(String(req.params.id), req.user!.id);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User deleted successfully.",
    data: null,
  });
});

export const userController = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
