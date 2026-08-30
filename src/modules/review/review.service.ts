import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateReviewInput,
  GetReviewsQueryInput,
  UpdateReviewStatusInput,
} from "./review.validation";
import { Prisma } from "../../../generated/prisma/client";

// Helper: Recalculate and update surveyor profile rating & review count
const syncSurveyorRating = async (
  tx: Prisma.TransactionClient,
  surveyorProfileId: string,
) => {
  const approvedReviews = await tx.surveyorReview.findMany({
    where: { surveyorProfileId, status: "APPROVED" },
    select: { rating: true },
  });

  const totalReviews = approvedReviews.length;
  const avgRating =
    totalReviews > 0
      ? approvedReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

  await tx.surveyorProfile.update({
    where: { id: surveyorProfileId },
    data: {
      rating: parseFloat(avgRating.toFixed(1)),
      totalReviews,
    },
  });
};

// 1. Create a review (Public submission)
const createReview = async (payload: CreateReviewInput) => {
  const surveyor = await prisma.surveyorProfile.findUnique({
    where: { id: payload.surveyorProfileId },
  });

  if (!surveyor) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor profile not found.");
  }

  const review = await prisma.surveyorReview.create({
    data: {
      surveyorProfileId: payload.surveyorProfileId,
      reviewerName: payload.reviewerName.trim(),
      serviceName: payload.serviceName?.trim() || undefined,
      rating: payload.rating,
      comment: payload.comment.trim(),
      status: "PENDING",
    },
    include: {
      surveyorProfile: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              imageUrl: true,
            },
          },
        },
      },
    },
  });

  return review;
};

// 2. Get all reviews with search, filter, and pagination (Admin only)
const getAllReviews = async (query: GetReviewsQueryInput) => {
  const { page, limit, searchTerm, status, rating, surveyorProfileId, sortBy } =
    query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.SurveyorReviewWhereInput[] = [];

  // Filter by status (if not ALL)
  if (status && status !== "ALL") {
    andConditions.push({ status });
  }

  // Filter by specific rating
  if (rating) {
    andConditions.push({ rating });
  }

  // Filter by surveyor profile ID
  if (surveyorProfileId) {
    andConditions.push({ surveyorProfileId });
  }

  // Search by reviewer name, comment, or surveyor name
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { reviewerName: { contains: term, mode: "insensitive" } },
        { comment: { contains: term, mode: "insensitive" } },
        {
          surveyorProfile: {
            user: {
              name: { contains: term, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  const where: Prisma.SurveyorReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<
    string,
    Prisma.SurveyorReviewOrderByWithRelationInput[]
  > = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    highest_rating: [{ rating: "desc" }, { createdAt: "desc" }],
    lowest_rating: [{ rating: "asc" }, { createdAt: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ createdAt: "desc" }];

  const [total, reviews] = await Promise.all([
    prisma.surveyorReview.count({ where }),
    prisma.surveyorReview.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        surveyorProfile: {
          select: {
            id: true,
            slug: true,
            headline: true,
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
                phone: true,
                district: true,
                upazila: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    data: reviews,
  };
};

// 3. Update review status (APPROVE / REJECT)
const updateReviewStatus = async (
  id: string,
  payload: UpdateReviewStatusInput,
) => {
  const existingReview = await prisma.surveyorReview.findUnique({
    where: { id },
  });

  if (!existingReview) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surveyorReview.update({
      where: { id },
      data: { status: payload.status },
      include: {
        surveyorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // Recalculate surveyor's aggregate rating and total reviews
    await syncSurveyorRating(tx, existingReview.surveyorProfileId);

    return updated;
  });
};

// 4. Delete review
const deleteReview = async (id: string) => {
  const existingReview = await prisma.surveyorReview.findUnique({
    where: { id },
  });

  if (!existingReview) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.surveyorReview.delete({ where: { id } });
    await syncSurveyorRating(tx, existingReview.surveyorProfileId);
  });

  return null;
};

export const reviewService = {
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
};

