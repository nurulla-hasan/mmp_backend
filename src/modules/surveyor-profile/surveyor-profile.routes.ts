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

// ── Admin Endpoints (ADMIN & SUPER_ADMIN) ──
surveyorProfileRouter.get(
  "/verifications",
  auth("ADMIN"),
  surveyorProfileController.getVerificationRequests,
);

surveyorProfileRouter.get(
  "/verifications/:id",
  auth("ADMIN"),
  surveyorProfileController.getVerificationRequestById,
);

surveyorProfileRouter.patch(
  "/:userId/verify",
  auth("ADMIN"),
  validate(verifySurveyorSchema),
  surveyorProfileController.verifySurveyor,
);

// ── Surveyor / User Endpoints ──
surveyorProfileRouter.post(
  "/profile",
  auth("USER"),
  validate(applyAsSurveyorSchema),
  surveyorProfileController.applyAsSurveyor,
);

surveyorProfileRouter.get(
  "/profile",
  auth("SURVEYOR"),
  surveyorProfileController.getMyProfile,
);

surveyorProfileRouter.patch(
  "/profile",
  auth("SURVEYOR"),
  validate(updateSurveyorProfileSchema),
  surveyorProfileController.updateMyProfile,
);

// ── Public Directory Endpoints ──
surveyorProfileRouter.get(
  "/",
  surveyorProfileController.getAllSurveyors,
);

surveyorProfileRouter.get(
  "/:slug",
  surveyorProfileController.getSurveyorBySlug,
);
