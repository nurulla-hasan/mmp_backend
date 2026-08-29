import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { districtController } from "./district.controller";
import {
  createDistrictSchema,
  createUpazilaSchema,
  updateDistrictSchema,
  updateUpazilaSchema,
} from "./district.validation";

export const districtRouter = Router();

districtRouter.get("/", districtController.getAllDistricts);

districtRouter.post(
  "/",
  auth("ADMIN"),
  validate(createDistrictSchema),
  districtController.createDistrict,
);

districtRouter.patch(
  "/:id",
  auth("ADMIN"),
  validate(updateDistrictSchema),
  districtController.updateDistrict,
);

districtRouter.delete(
  "/:id",
  auth("ADMIN"),
  districtController.deleteDistrict,
);

districtRouter.post(
  "/upazila",
  auth("ADMIN"),
  validate(createUpazilaSchema),
  districtController.createUpazila,
);

districtRouter.patch(
  "/upazila/:id",
  auth("ADMIN"),
  validate(updateUpazilaSchema),
  districtController.updateUpazila,
);

districtRouter.delete(
  "/upazila/:id",
  auth("ADMIN"),
  districtController.deleteUpazila,
);
