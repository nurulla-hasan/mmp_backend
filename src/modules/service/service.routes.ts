import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRouter = Router();

// 1. Get all services (Public)
serviceRouter.get(
  "/",
  serviceController.getAllServices,
);

// 2. Create service (Admin only)
serviceRouter.post(
  "/",
  auth("ADMIN"),
  validate(createServiceSchema),
  serviceController.createService,
);

// 3. Update service (Admin only)
serviceRouter.patch(
  "/:slug",
  auth("ADMIN"),
  validate(updateServiceSchema),
  serviceController.updateService,
);

// 4. Delete service (Admin only)
serviceRouter.delete(
  "/:slug",
  auth("ADMIN"),
  serviceController.deleteService,
);
