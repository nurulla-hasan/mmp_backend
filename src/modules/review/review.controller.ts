import { catchAsync } from "../../utils/catch-async";
import { sendResponse } from "../../utils/send-response";
import { reviewService } from "./review.service";
import { getReviewsQuerySchema } from "./review.validation";

// 1. Public: Create review
const createReview = catchAsync(async (req, res) => {
  const result = await reviewService.createReview(req.body);
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

export const reviewController = {
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
};

