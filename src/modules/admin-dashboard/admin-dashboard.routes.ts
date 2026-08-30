import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { adminDashboardController } from "./admin-dashboard.controller";

export const adminDashboardRouter = Router();

// Admin / Super Admin: Get aggregated dashboard stats
adminDashboardRouter.get(
  "/stats",
  auth("ADMIN", "SUPER_ADMIN"),
  adminDashboardController.getDashboardStats,
);

