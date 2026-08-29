import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  AddSurveyorServiceInput,
  UpdateSurveyorServiceInput,
} from "./surveyor-service.validation";

const getProfileOrThrow = async (userId: string) => {
  const profile = await prisma.surveyorProfile.findUnique({
    where: { userId },
  });

  if (!profile) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      "Surveyor profile not found. Please create your profile first.",
    );
  }

  return profile;
};

const addService = async (userId: string, payload: AddSurveyorServiceInput) => {
  const profile = await getProfileOrThrow(userId);

  const service = await prisma.service.findUnique({
    where: { id: payload.serviceId },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

  const existing = await prisma.surveyorService.findUnique({
    where: {
      surveyorProfileId_serviceId: {
        surveyorProfileId: profile.id,
        serviceId: payload.serviceId,
      },
    },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This service is already added to your profile.",
    );
  }

  return prisma.surveyorService.create({
    data: {
      surveyorProfileId: profile.id,
      ...payload,
    },
    include: { service: true },
  });
};

const getMyServices = async (userId: string) => {
  const profile = await getProfileOrThrow(userId);

  return prisma.surveyorService.findMany({
    where: { surveyorProfileId: profile.id },
    include: { service: true },
    orderBy: { startingPrice: "asc" },
  });
};

const updateServicePrice = async (
  userId: string,
  surveyorServiceId: string,
  payload: UpdateSurveyorServiceInput,
) => {
  const profile = await getProfileOrThrow(userId);

  const record = await prisma.surveyorService.findUnique({
    where: { id: surveyorServiceId },
  });

  if (!record || record.surveyorProfileId !== profile.id) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor service not found.");
  }

  return prisma.surveyorService.update({
    where: { id: surveyorServiceId },
    data: { startingPrice: payload.startingPrice },
    include: { service: true },
  });
};

const removeService = async (userId: string, surveyorServiceId: string) => {
  const profile = await getProfileOrThrow(userId);

  const record = await prisma.surveyorService.findUnique({
    where: { id: surveyorServiceId },
  });

  if (!record || record.surveyorProfileId !== profile.id) {
    throw new AppError(httpStatus.NOT_FOUND, "Surveyor service not found.");
  }

  await prisma.surveyorService.delete({ where: { id: surveyorServiceId } });

  return null;
};

export const surveyorServiceService = {
  addService,
  getMyServices,
  updateServicePrice,
  removeService,
};
