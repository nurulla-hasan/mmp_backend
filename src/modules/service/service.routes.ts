import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRouter = Router();

// 1. Get all services (Public & Admin)
serviceRouter.get(
  "/",
  serviceController.getAllServices,
);

// 2. Get service by ID or Slug
serviceRouter.get(
  "/:id",
  serviceController.getServiceById,
);

// 3. Create service (Admin only)
serviceRouter.post(
  "/",
  auth("ADMIN"),
  validate(createServiceSchema),
  serviceController.createService,
);

// 4. Update service (Admin only)
serviceRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updateServiceSchema),
  serviceController.updateService,
);

// 5. Delete service (Admin only)
serviceRouter.delete(
  "/:id",
  auth("ADMIN"),
  serviceController.deleteService,
);
