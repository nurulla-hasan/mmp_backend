import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { surveyorServiceController } from "./surveyor-service.controller";
import {
  addSurveyorServiceSchema,
  updateSurveyorServiceSchema,
} from "./surveyor-service.validation";

export const surveyorServiceRouter = Router();

surveyorServiceRouter.use(auth("SURVEYOR"));

surveyorServiceRouter
  .route("/")
  .get(surveyorServiceController.getMyServices)
  .post(
    validate(addSurveyorServiceSchema),
    surveyorServiceController.addService,
  );

surveyorServiceRouter
  .route("/:id")
  .patch(
    validate(updateSurveyorServiceSchema),
    surveyorServiceController.updateServicePrice,
  )
  .delete(surveyorServiceController.removeService);
