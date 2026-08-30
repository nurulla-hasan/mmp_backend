import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { reviewService } from "./review.service";
import { getReviewsQuerySchema } from "./review.validation";

// 1. Authenticated User: Create review
const createReview = catchAsync(async (req, res) => {
  const user = req.user as { id: string; name: string; email: string };
  const result = await reviewService.createReview(user, req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: "Review submitted successfully. It will be visible after admin verification.",
    data: result,
  });
});

// 2. Admin: Get all reviews
const getAllReviews = catchAsync(async (req, res) => {
  const query = getReviewsQuerySchema.parse(req.query);
  const result = await reviewService.getAllReviews(query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Reviews retrieved successfully.",
    data: result.data,
    meta: result.meta,
  });
});

// 3. Admin: Update review status (APPROVE / REJECT)
const updateReviewStatus = catchAsync(async (req, res) => {
  const result = await reviewService.updateReviewStatus(
    String(req.params.id),
    req.body,
  );
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: `Review ${result.status.toLowerCase()} successfully.`,
    data: result,
  });
});

// 4. Admin: Delete review
const deleteReview = catchAsync(async (req, res) => {
  await reviewService.deleteReview(String(req.params.id));
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Review deleted successfully.",
    data: null,
  });
});

// 5. Public: Get featured testimonials
const getTestimonials = catchAsync(async (_req, res) => {
  const result = await reviewService.getTestimonials();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Testimonials retrieved successfully.",
    data: result,
  });
});

export const reviewController = {
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getTestimonials,
};
