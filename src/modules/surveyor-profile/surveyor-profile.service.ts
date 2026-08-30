import { randomUUID } from "node:crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  ApplyAsSurveyorInput,
  UpdateSurveyorProfileInput,
  VerifySurveyorInput,
} from "./surveyor-profile.validation";
import { Prisma } from "../../../generated/prisma/client";

const profileInclude = {
  surveyorServices: { include: { service: true } },
  serviceAreas: true,
} as const;

const getMyProfile = async (userId: string) => {
  const profile = await prisma.surveyorProfile.findUnique({
    where: { userId },
    include: profileInclude,
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor profile not found.");
  }

  return profile;
};

const applyAsSurveyor = async (userId: string, payload: ApplyAsSurveyorInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const existing = await prisma.surveyorProfile.findUnique({
    where: { userId },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "You have already applied as a surveyor.",
    );
  }

  const serviceIds = payload.services.map((s) => s.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true },
  });

  if (services.length !== serviceIds.length) {
    throw new AppError(httpStatus.NOT_FOUND, "One or more services not found.");
  }

  const slug = `${user.name
    .toLowerCase()
    .replace(/\s+/g, "-")}-${randomUUID().slice(0, 8)}`;

  return prisma.surveyorProfile.create({
    data: {
      userId,
      slug,
      headline: payload.headline,
      bio: payload.bio,
      experienceYears: payload.experienceYears,
      certificateUrl: payload.certificateUrl,
      serviceAreas: { create: payload.serviceAreas },
      surveyorServices: {
        create: payload.services.map((s) => ({
          serviceId: s.serviceId,
          startingPrice: s.startingPrice,
        })),
      },
    },
    include: profileInclude,
  });
};

const updateMyProfile = async (
  userId: string,
  payload: UpdateSurveyorProfileInput,
) => {
  const profile = await getMyProfile(userId);
  const { serviceAreas, services, ...profileData } = payload;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surveyorProfile.update({
      where: { id: profile.id },
      data: profileData,
      include: profileInclude,
    });

    if (payload.serviceAreas) {
      await tx.serviceArea.deleteMany({
        where: { surveyorProfileId: profile.id },
      });
      await tx.serviceArea.createMany({
        data: payload.serviceAreas.map((a) => ({
          surveyorProfileId: profile.id,
          district: a.district,
          upazilas: a.upazilas,
        })),
      });
    }

    if (payload.services) {
      await tx.surveyorService.deleteMany({
        where: { surveyorProfileId: profile.id },
      });
      await tx.surveyorService.createMany({
        data: payload.services.map((s) => ({
          surveyorProfileId: profile.id,
          serviceId: s.serviceId,
          startingPrice: s.startingPrice,
        })),
      });
    }

    return updated;
  });
};

const verifySurveyor = async (targetUserId: string, payload: VerifySurveyorInput) => {
  const profile = await prisma.surveyorProfile.findUnique({
    where: { userId: targetUserId },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor profile not found.");
  }

  const isApproved = payload.status === "APPROVED";

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surveyorProfile.update({
      where: { id: profile.id },
      data: {
        verificationStatus: payload.status,
        isVerified: isApproved,
        verifiedAt: isApproved ? new Date() : null,
        adminNote: payload.adminNote,
      },
      include: profileInclude,
    });

    if (isApproved) {
      await tx.user.update({
        where: { id: targetUserId },
        data: { role: "SURVEYOR" },
      });
    }

    return updated;
  });
};

const getAllSurveyors = async (query: Record<string, unknown> = {}) => {
  const {
    searchTerm,
    district,
    service,
    rating,
    experienceMin,
    experienceMax,
    sortBy,
    page = "1",
    limit = "12",
  } = query;

  const andConditions: Prisma.SurveyorProfileWhereInput[] = [
    { verificationStatus: "APPROVED" },
  ];

  if (searchTerm) {
    const term = (searchTerm as string).trim();
    andConditions.push({
      OR: [
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { district: { contains: term, mode: "insensitive" } } },
        { user: { upazila: { contains: term, mode: "insensitive" } } },
        { headline: { contains: term, mode: "insensitive" } },
        { bio: { contains: term, mode: "insensitive" } },
        {
          surveyorServices: {
            some: {
              service: {
                name: { contains: term, mode: "insensitive" },
              },
            },
          },
        },
        {
          serviceAreas: {
            some: {
              district: { contains: term, mode: "insensitive" },
            },
          },
        },
      ],
    });
  }

  if (district) {
    andConditions.push({
      serviceAreas: {
        some: {
          district: { equals: district as string, mode: "insensitive" },
        },
      },
    });
  }

  if (service) {
    andConditions.push({
      surveyorServices: {
        some: {
          service: {
            slug: service as string,
          },
        },
      },
    });
  }

  if (rating) {
    const minRating = Number(rating);
    if (!Number.isNaN(minRating)) {
      andConditions.push({
        rating: { gte: minRating },
      });
    }
  }

  if (experienceMin || experienceMax) {
    const expFilter: Prisma.IntFilter = {};
    if (experienceMin) expFilter.gte = parseInt(experienceMin as string, 10);
    if (experienceMax) expFilter.lte = parseInt(experienceMax as string, 10);
    andConditions.push({ experienceYears: expFilter });
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(
    50,
    Math.max(1, parseInt(limit as string, 10) || 12),
  );
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const orderByMap: Record<
    string,
    Prisma.SurveyorProfileOrderByWithRelationInput[]
  > = {
    rating_desc: [{ rating: "desc" }, { createdAt: "desc" }],
    experience_desc: [{ experienceYears: "desc" }, { createdAt: "desc" }],
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
  };

  const orderBy: Prisma.SurveyorProfileOrderByWithRelationInput[] = orderByMap[
    sortBy as string
  ] ?? [
    { user: { isSubscribed: "desc" } },
    { rating: "desc" },
    { createdAt: "desc" },
  ];

  const where: Prisma.SurveyorProfileWhereInput = {
    AND: andConditions,
  };

  const [results, total] = await Promise.all([
    prisma.surveyorProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            phone: true,
            whatsappNumber: true,
            district: true,
            upazila: true,
            isSubscribed: true,
            createdAt: true,
          },
        },
        surveyorServices: {
          include: { service: true },
        },
        serviceAreas: true,
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.surveyorProfile.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limitNum) || 1;

  return {
    data: results,
    meta: {
      page: pageNum,
      limit: limitNum,
      total: Number(total),
      totalPages,
    },
  };
};

const getSurveyorBySlug = async (slug: string) => {
  const profile = await prisma.surveyorProfile.findUnique({
    where: { slug },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          phone: true,
          whatsappNumber: true,
          district: true,
          upazila: true,
          isSubscribed: true,
          createdAt: true,
        },
      },
      surveyorServices: {
        include: { service: true },
      },
      serviceAreas: true,
      reviews: {
        where: { status: "APPROVED" },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor profile not found.");
  }

  return profile;
};

const getVerificationRequests = async (query: Record<string, unknown> = {}) => {
  const { page = 1, limit = 10, searchTerm, status = "ALL", sortBy = "newest" } = query;
  const pageNum = Math.max(1, Number(page) || 1);
  const limitNum = Math.max(1, Number(limit) || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.SurveyorProfileWhereInput[] = [];

  // Filter by verification status (if not ALL)
  if (status && status !== "ALL") {
    andConditions.push({ verificationStatus: status as Prisma.EnumVerificationStatusFilter["equals"] });
  }

  // Search by user name, phone, email, district, upazila, or headline
  if (typeof searchTerm === "string" && searchTerm.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
        { user: { phone: { contains: term, mode: "insensitive" } } },
        { user: { district: { contains: term, mode: "insensitive" } } },
        { headline: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.SurveyorProfileWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  const orderBy: Prisma.SurveyorProfileOrderByWithRelationInput[] =
    sortBy === "oldest" ? [{ createdAt: "asc" }] : [{ createdAt: "desc" }];

  const [total, rawRequests] = await Promise.all([
    prisma.surveyorProfile.count({ where }),
    prisma.surveyorProfile.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            whatsappNumber: true,
            district: true,
            upazila: true,
            imageUrl: true,
            status: true,
            role: true,
            createdAt: true,
          },
        },
        surveyorServices: {
          include: {
            service: true,
          },
        },
        serviceAreas: true,
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
    data: rawRequests,
  };
};

const getVerificationRequestById = async (id: string) => {
  const profile = await prisma.surveyorProfile.findFirst({
    where: {
      OR: [{ id }, { userId: id }],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          whatsappNumber: true,
          district: true,
          upazila: true,
          imageUrl: true,
          status: true,
          role: true,
          createdAt: true,
        },
      },
      surveyorServices: {
        include: {
          service: true,
        },
      },
      serviceAreas: true,
    },
  });

  if (!profile) {
    throw new AppError(httpStatus.NOT_FOUND, "Verification request not found.");
  }

  return profile;
};

export const surveyorProfileService = {
  getAllSurveyors,
  getSurveyorBySlug,
  getMyProfile,
  applyAsSurveyor,
  updateMyProfile,
  verifySurveyor,
  getVerificationRequests,
  getVerificationRequestById,
};
