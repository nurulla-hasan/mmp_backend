import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { surveyorServiceController } from "./surveyor-service.controller";
import {
  addSurveyorServiceSchema,
  updateSurveyorServiceSchema,
} from "./surveyor-service.validation";

export const surveyorServiceRouter = Router();

// All routes in this module require SURVEYOR role
surveyorServiceRouter.use(auth("SURVEYOR"));

// 1. Get all services for logged-in surveyor
surveyorServiceRouter.get(
  "/",
  surveyorServiceController.getMyServices,
);

// 2. Add a new service to surveyor profile
surveyorServiceRouter.post(
  "/",
  validate(addSurveyorServiceSchema),
  surveyorServiceController.addService,
);

// 3. Update starting price of an assigned service
surveyorServiceRouter.patch(
  "/:id",
  validate(updateSurveyorServiceSchema),
  surveyorServiceController.updateServicePrice,
);

// 4. Remove assigned service from profile
surveyorServiceRouter.delete(
  "/:id",
  surveyorServiceController.removeService,
);
