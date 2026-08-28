import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { CreateServiceInput, UpdateServiceInput } from "./service.validation";

const createService = async (payload: CreateServiceInput) => {
  const existing = await prisma.service.findUnique({
    where: { slug: payload.slug },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "A service with this slug already exists.");
  }

  const service = await prisma.service.create({
    data: {
      slug: payload.slug,
      name: payload.name,
      description: payload.description,
      startingPrice: payload.startingPrice,
      isActive: payload.isActive ?? true,
    },
  });

  return service;
};

const getAllServices = async () => {
  return prisma.service.findMany({
    orderBy: { createdAt: "desc" },
  });
};

const getActiveServices = async () => {
  return prisma.service.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });
};

const getServiceBySlug = async (slug: string) => {
  const service = await prisma.service.findUnique({
    where: { slug },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

  return service;
};

const updateService = async (slug: string, payload: UpdateServiceInput) => {
  await getServiceBySlug(slug);

  return prisma.service.update({
    where: { slug },
    data: payload,
  });
};

const deleteService = async (slug: string) => {
  await getServiceBySlug(slug);

  await prisma.service.delete({
    where: { slug },
  });

  return null;
};

export const serviceService = {
  createService,
  getAllServices,
  getActiveServices,
  updateService,
  deleteService,
};
