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

// 1. Create a review (Authenticated User)
const createReview = async (
  user: { id: string; name: string; email: string },
  payload: CreateReviewInput,
) => {
  const surveyor = await prisma.surveyorProfile.findUnique({
    where: { id: payload.surveyorProfileId },
  });

  if (!surveyor) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor profile not found.");
  }

  // Prevent surveyor from reviewing their own profile
  if (surveyor.userId === user.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot write a review for your own surveyor profile.",
    );
  }

  const review = await prisma.surveyorReview.create({
    data: {
      surveyorProfileId: payload.surveyorProfileId,
      userId: user.id,
      reviewerName: user.name || "Verified Client",
      reviewerEmail: user.email,
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
              email: true,
              phone: true,
              imageUrl: true,
            },
          },
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  return review;
};

// 2. Get all reviews (Admin)
const getAllReviews = async (query: GetReviewsQueryInput) => {
  const { page, limit, searchTerm, status, rating, surveyorProfileId, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.SurveyorReviewWhereInput[] = [];

  // Filter by status (if not ALL)
  if (status && status !== "ALL") {
    andConditions.push({ status });
  }

  // Filter by rating
  if (rating) {
    andConditions.push({ rating });
  }

  // Filter by surveyor profile ID
  if (surveyorProfileId) {
    andConditions.push({ surveyorProfileId });
  }

  // Search by reviewerName, reviewerEmail, comment, serviceName, or surveyor name
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { reviewerName: { contains: term, mode: "insensitive" } },
        { reviewerEmail: { contains: term, mode: "insensitive" } },
        { comment: { contains: term, mode: "insensitive" } },
        { serviceName: { contains: term, mode: "insensitive" } },
        { surveyorProfile: { user: { name: { contains: term, mode: "insensitive" } } } },
      ],
    });
  }

  const where: Prisma.SurveyorReviewWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<string, Prisma.SurveyorReviewOrderByWithRelationInput[]> = {
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
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                imageUrl: true,
                district: true,
                upazila: true,
              },
            },
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
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

// 3. Update review status (Admin: APPROVE or REJECT)
const updateReviewStatus = async (
  id: string,
  payload: UpdateReviewStatusInput,
) => {
  const existing = await prisma.surveyorReview.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  const updatedReview = await prisma.$transaction(async (tx) => {
    const review = await tx.surveyorReview.update({
      where: { id },
      data: { status: payload.status },
      include: {
        surveyorProfile: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    // Recalculate surveyor average rating and count
    await syncSurveyorRating(tx, existing.surveyorProfileId);

    return review;
  });

  return updatedReview;
};

// 4. Delete review (Admin)
const deleteReview = async (id: string) => {
  const existing = await prisma.surveyorReview.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Review not found.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.surveyorReview.delete({
      where: { id },
    });

    // Recalculate surveyor average rating and count
    await syncSurveyorRating(tx, existing.surveyorProfileId);
  });

  return null;
};

// 5. Get featured approved testimonials for public home page
const getTestimonials = async () => {
  const reviews = await prisma.surveyorReview.findMany({
    where: { status: "APPROVED", rating: { gte: 4 } },
    take: 6,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { name: true, imageUrl: true, district: true } },
      surveyorProfile: {
        select: {
          slug: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  return reviews.map((r) => {
    const bracketMatch = r.comment.match(/^\[(.*?)\]\s*(.*)$/);
    return {
      id: r.id,
      reviewerName: r.user?.name || r.reviewerName,
      reviewerDistrict: r.user?.district,
      surveyorName: r.surveyorProfile?.user?.name,
      surveyorSlug: r.surveyorProfile?.slug,
      serviceName: r.serviceName || (bracketMatch ? bracketMatch[1] : undefined),
      comment: bracketMatch ? bracketMatch[2] : r.comment,
      rating: r.rating,
      createdAt: r.createdAt,
    };
  });
};

export const reviewService = {
  createReview,
  getAllReviews,
  updateReviewStatus,
  deleteReview,
  getTestimonials,
};
