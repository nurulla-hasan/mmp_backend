import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRouter = Router();

serviceRouter.get("/active", serviceController.getActiveServices);

// Admin only
serviceRouter.post(
  "/",
  auth("ADMIN"),
  validate(createServiceSchema),
  serviceController.createService,
);

serviceRouter.get("/", auth("ADMIN"), serviceController.getAllServices);

serviceRouter.patch(
  "/:slug",
  auth("ADMIN"),
  validate(updateServiceSchema),
  serviceController.updateService,
);

serviceRouter.delete("/:slug", auth("ADMIN"), serviceController.deleteService);
