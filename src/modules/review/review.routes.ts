import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { reviewController } from "./review.controller";
import {
  createReviewSchema,
  updateReviewStatusSchema,
} from "./review.validation";

export const reviewRouter = Router();

// Public: Featured Testimonials for home page
reviewRouter.get("/testimonials", reviewController.getTestimonials);

// Authenticated Users/Surveyors/Admins can submit a review
reviewRouter.post(
  "/",
  auth("USER", "SURVEYOR", "ADMIN", "SUPER_ADMIN"),
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
