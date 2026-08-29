import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { serviceController } from "./service.controller";
import {
  createServiceSchema,
  updateServiceSchema,
} from "./service.validation";

export const serviceRouter = Router();

// Admin only
serviceRouter.post(
  "/",
  auth("ADMIN"),
  validate(createServiceSchema),
  serviceController.createService,
);

// Public: সার্ভিস লিস্ট (id + slug + name) সবাই দেখতে পারবে
serviceRouter.get("/", serviceController.getAllServices);

serviceRouter.patch(
  "/:slug",
  auth("ADMIN"),
  validate(updateServiceSchema),
  serviceController.updateService,
);

serviceRouter.delete("/:slug", auth("ADMIN"), serviceController.deleteService);
