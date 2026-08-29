import { randomUUID } from "node:crypto";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  ApplyAsSurveyorInput,
  UpdateSurveyorProfileInput,
  VerifySurveyorInput,
} from "./surveyor-profile.validation";

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

  const data: {
    headline?: string;
    bio?: string | null;
    experienceYears?: number;
  } = {};

  if (payload.headline !== undefined) data.headline = payload.headline;
  if (payload.bio !== undefined) data.bio = payload.bio;
  if (payload.experienceYears !== undefined) {
    data.experienceYears = payload.experienceYears;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.surveyorProfile.update({
      where: { id: profile.id },
      data,
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

export const surveyorProfileService = {
  getMyProfile,
  applyAsSurveyor,
  updateMyProfile,
  verifySurveyor,
};
