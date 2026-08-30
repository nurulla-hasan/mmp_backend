import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateServiceInput,
  GetServicesQueryInput,
  UpdateServiceInput,
} from "./service.validation";
import { Prisma } from "../../../generated/prisma/client";

// 1. Get all services with search, pagination and sorting
const getAllServices = async (query: GetServicesQueryInput) => {
  const { page, limit, searchTerm, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.ServiceWhereInput[] = [];

  // Search by name, slug, or description
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { slug: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const whereCondition: Prisma.ServiceWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<string, Prisma.ServiceOrderByWithRelationInput[]> = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    name_asc: [{ name: "asc" }],
    name_desc: [{ name: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ createdAt: "desc" }];

  const [total, rawServices] = await Promise.all([
    prisma.service.count({ where: whereCondition }),
    prisma.service.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      include: {
        _count: {
          select: {
            surveyorServices: true,
          },
        },
      },
    }),
  ]);

  const services = rawServices.map((service) => ({
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    surveyorsCount: service._count.surveyorServices,
  }));

  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    data: services,
  };
};

// 2. Get single service by ID or Slug
const getServiceById = async (idOrSlug: string) => {
  const service = await prisma.service.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
    include: {
      _count: {
        select: {
          surveyorServices: true,
        },
      },
    },
  });

  if (!service) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    createdAt: service.createdAt,
    updatedAt: service.updatedAt,
    surveyorsCount: service._count.surveyorServices,
  };
};

// 3. Create service
const createService = async (payload: CreateServiceInput) => {
  const existing = await prisma.service.findUnique({
    where: { slug: payload.slug },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A service with this slug already exists.",
    );
  }

  const service = await prisma.service.create({
    data: {
      name: payload.name,
      slug: payload.slug,
      description: payload.description || null,
    },
  });

  return service;
};

// 4. Update service by ID or Slug
const updateService = async (
  idOrSlug: string,
  payload: UpdateServiceInput,
) => {
  const existing = await prisma.service.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

  // If changing slug, ensure uniqueness
  if (payload.slug && payload.slug !== existing.slug) {
    const slugTaken = await prisma.service.findUnique({
      where: { slug: payload.slug },
    });
    if (slugTaken) {
      throw new AppError(
        httpStatus.CONFLICT,
        "A service with this new slug already exists.",
      );
    }
  }

  const updated = await prisma.service.update({
    where: { id: existing.id },
    data: {
      name: payload.name ?? existing.name,
      slug: payload.slug ?? existing.slug,
      description:
        payload.description !== undefined
          ? payload.description
          : existing.description,
    },
  });

  return updated;
};

// 5. Delete service by ID or Slug
const deleteService = async (idOrSlug: string) => {
  const existing = await prisma.service.findFirst({
    where: {
      OR: [{ id: idOrSlug }, { slug: idOrSlug }],
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Service not found.");
  }

  await prisma.service.delete({
    where: { id: existing.id },
  });

  return null;
};

export const serviceService = {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
