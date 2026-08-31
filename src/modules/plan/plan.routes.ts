import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { planController } from "./plan.controller";
import { createPlanSchema, updatePlanSchema } from "./plan.validation";

export const planRouter = Router();

// Admin & Public: Get auto-pro setting
planRouter.get("/settings/auto-pro", planController.getAutoProSetting);

// Admin: Toggle auto-pro setting
planRouter.patch(
  "/settings/auto-pro",
  auth("ADMIN"),
  planController.setAutoProSetting,
);

// Public: Get all plans
planRouter.get("/", planController.getAllPlans);

// Public: Get single plan
planRouter.get("/:id", planController.getPlanById);

// Admin: Create plan
planRouter.post(
  "/",
  auth("ADMIN"),
  validate(createPlanSchema),
  planController.createPlan,
);

// Admin: Update plan
planRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updatePlanSchema),
  planController.updatePlan,
);

// Admin: Toggle plan active status
planRouter.patch(
  "/:id/status",
  auth("ADMIN"),
  planController.togglePlanStatus,
);

// Admin: Delete plan
planRouter.delete(
  "/:id",
  auth("ADMIN"),
  planController.deletePlan,
);

