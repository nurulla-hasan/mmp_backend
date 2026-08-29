import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { surveyorProfileController } from "./surveyor-profile.controller";
import {
  applyAsSurveyorSchema,
  updateSurveyorProfileSchema,
  verifySurveyorSchema,
} from "./surveyor-profile.validation";

export const surveyorProfileRouter = Router();

surveyorProfileRouter.post(
  "/profile",
  validate(applyAsSurveyorSchema),
  surveyorProfileController.applyAsSurveyor,
);

surveyorProfileRouter.get(
  "/profile",
  auth("SURVEYOR"),
  surveyorProfileController.getMyProfile,
);

surveyorProfileRouter.get(
  "/",
  surveyorProfileController.getAllSurveyors,
);

surveyorProfileRouter.get(
  "/:slug",
  surveyorProfileController.getSurveyorBySlug,
);

surveyorProfileRouter.patch(
  "/profile",
  auth("SURVEYOR"),
  validate(updateSurveyorProfileSchema),
  surveyorProfileController.updateMyProfile,
);

surveyorProfileRouter.patch(
  "/:userId/verify",
  auth("ADMIN"),
  validate(verifySurveyorSchema),
  surveyorProfileController.verifySurveyor,
);
