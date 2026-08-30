import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { reviewController } from "./review.controller";
import {
  createReviewSchema,
  updateReviewStatusSchema,
} from "./review.validation";

export const reviewRouter = Router();

// Public: Submit a review
reviewRouter.post(
  "/",
  validate(createReviewSchema),
  reviewController.createReview,
);

// Admin: Get all reviews
reviewRouter.get(
  "/",
  auth("ADMIN"),
  reviewController.getAllReviews,
);

// Admin: Update review status (APPROVE / REJECT)
reviewRouter.patch(
  "/:id/status",
  auth("ADMIN"),
  validate(updateReviewStatusSchema),
  reviewController.updateReviewStatus,
);

// Admin: Delete review
reviewRouter.delete(
  "/:id",
  auth("ADMIN"),
  reviewController.deleteReview,
);

