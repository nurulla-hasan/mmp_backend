import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { calculationController } from "./calculation.controller";
import {
  createCalculationSchema,
  updateCalculationSchema,
} from "./calculation.validation";

export const calculationRouter = Router();

// ==========================================
// Stats Endpoints
// ==========================================
calculationRouter.get(
  "/stats/me",
  auth(),
  calculationController.getMyMeasurementStats,
);

calculationRouter.get(
  "/stats/all",
  auth("ADMIN"),
  calculationController.getAllMeasurementStats,
);

// ==========================================
// Calculation CRUD Endpoints
// ==========================================

// 1. Get user calculations
calculationRouter.get(
  "/",
  auth(),
  calculationController.getUserCalculations,
);

// 2. Create calculation
calculationRouter.post(
  "/",
  auth(),
  validate(createCalculationSchema),
  calculationController.createCalculation,
);

// 3. Get calculation by ID
calculationRouter.get(
  "/:id",
  auth(),
  calculationController.getCalculationById,
);

// 4. Update calculation
calculationRouter.patch(
  "/:id",
  auth(),
  validate(updateCalculationSchema),
  calculationController.updateCalculation,
);

// 5. Delete calculation
calculationRouter.delete(
  "/:id",
  auth(),
  calculationController.deleteCalculation,
);
