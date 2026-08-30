import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { userService } from "./user.service";
import { getUsersQuerySchema } from "./user.validation";

// 1. Get all users (Admin & Super Admin)
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

// 2. Create new Admin user (Super Admin only)
const createAdmin = catchAsync(async (req, res) => {
  const result = await userService.createAdmin(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Admin created successfully.",
    data: result,
  });
});

// 3. Get user by ID
const getUserById = catchAsync(async (req, res) => {
  const result = await userService.getUserById(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User details retrieved successfully.",
    data: result,
  });
});

// 4. Update user status (ACTIVE | BLOCKED)
const updateUserStatus = catchAsync(async (req, res) => {
  const result = await userService.updateUserStatus(
    String(req.params.id),
    req.body,
    { id: req.user!.id, role: req.user!.role },
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "User status updated successfully.",
    data: result,
  });
});

// 5. Update user role (USER | SURVEYOR | ADMIN | SUPER_ADMIN)
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

// 6. Delete user
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
  createAdmin,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
