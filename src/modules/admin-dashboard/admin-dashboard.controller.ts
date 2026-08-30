import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { adminDashboardService } from "./admin-dashboard.service";

// 1. Get Admin Dashboard Aggregated Stats
const getDashboardStats = catchAsync(async (req, res) => {
  const result = await adminDashboardService.getDashboardStats();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Admin dashboard stats retrieved successfully.",
    data: result,
  });
});

export const adminDashboardController = {
  getDashboardStats,
};

