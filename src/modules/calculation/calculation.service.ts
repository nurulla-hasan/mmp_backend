import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type { Prisma } from "../../../generated/prisma/client";
import type {
  CreateCalculationInput,
  UpdateCalculationInput,
} from "./calculation.validation";

const createCalculation = async (
  userId: string,
  data: CreateCalculationInput,
) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create Calculation
    const calculation = await tx.calculation.create({
      data: {
        userId,
        name: data.name,
        mapName: data.mapName,
        scaleType: data.scaleType || "link",
        scalePxPerUnit: data.scalePxPerUnit,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
        plots: {
          create: data.plots.map((plot) => ({
            plotNumber: plot.plotNumber,
            points: plot.points,
            areaSqLink: plot.areaSqLink,
            areaShotok: plot.areaShotok,
            areaKatha: plot.areaKatha,
          })),
        },
      },
      include: {
        plots: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    // 2. Upsert user measurement stats
    await tx.userMeasurementStat.upsert({
      where: { userId },
      create: {
        userId,
        plotsCompleted: data.plots.length,
        calculationsCount: 1,
        lastActivityAt: new Date(),
      },
      update: {
        plotsCompleted: {
          increment: data.plots.length,
        },
        calculationsCount: {
          increment: 1,
        },
        lastActivityAt: new Date(),
      },
    });

    return calculation;
  });

  return result;
};

const getUserCalculations = async (
  userId: string,
  query: Record<string, unknown> = {},
) => {
  const { searchTerm, page, limit, sortBy } = query;

  const andConditions: Prisma.CalculationWhereInput[] = [{ userId }];

  if (searchTerm && typeof searchTerm === "string" && searchTerm.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { mapName: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  // Pagination
  const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
  const limitNum = Math.min(
    100,
    Math.max(1, parseInt(limit as string, 10) || 10),
  );
  const skip = (pageNum - 1) * limitNum;

  // Sorting
  const orderByMap: Record<
    string,
    Prisma.CalculationOrderByWithRelationInput[]
  > = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    name_asc: [{ name: "asc" }],
    name_desc: [{ name: "desc" }],
  };

  const orderBy: Prisma.CalculationOrderByWithRelationInput[] = orderByMap[
    sortBy as string
  ] ?? [{ createdAt: "desc" }];

  const where: Prisma.CalculationWhereInput = {
    AND: andConditions,
  };

  const [results, total] = await Promise.all([
    prisma.calculation.findMany({
      where,
      include: {
        plots: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy,
      skip,
      take: limitNum,
    }),
    prisma.calculation.count({ where }),
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

const getCalculationById = async (
  userId: string,
  id: string,
  userRole?: string,
) => {
  const calculation = await prisma.calculation.findUnique({
    where: { id },
    include: {
      plots: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!calculation) {
    throw new AppError(httpStatus.NOT_FOUND, "Calculation record not found.");
  }

  if (calculation.userId !== userId && userRole !== "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to view this calculation.",
    );
  }

  return calculation;
};

const updateCalculation = async (
  userId: string,
  id: string,
  data: UpdateCalculationInput,
) => {
  const existing = await prisma.calculation.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Calculation record not found.");
  }

  if (existing.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to edit this calculation.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    let plotsCreatedCount = 0;

    if (data.plots) {
      // Remove previous plots and recreate
      await tx.plot.deleteMany({
        where: { calculationId: id },
      });

      await tx.plot.createMany({
        data: data.plots.map((plot) => ({
          calculationId: id,
          plotNumber: plot.plotNumber,
          points: plot.points,
          areaSqLink: plot.areaSqLink,
          areaShotok: plot.areaShotok,
          areaKatha: plot.areaKatha,
        })),
      });

      plotsCreatedCount = data.plots.length;
    }

    const updated = await tx.calculation.update({
      where: { id },
      data: {
        name: data.name,
        mapName: data.mapName,
        scaleType: data.scaleType,
        scalePxPerUnit: data.scalePxPerUnit,
        imageWidth: data.imageWidth,
        imageHeight: data.imageHeight,
      },
      include: {
        plots: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (plotsCreatedCount > 0) {
      await tx.userMeasurementStat.upsert({
        where: { userId },
        create: {
          userId,
          plotsCompleted: plotsCreatedCount,
          calculationsCount: 1,
          lastActivityAt: new Date(),
        },
        update: {
          lastActivityAt: new Date(),
        },
      });
    }

    return updated;
  });

  return result;
};

const deleteCalculation = async (
  userId: string,
  id: string,
  userRole?: string,
) => {
  const existing = await prisma.calculation.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Calculation record not found.");
  }

  if (existing.userId !== userId && userRole !== "ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to delete this calculation.",
    );
  }

  await prisma.calculation.delete({
    where: { id },
  });
};

const getMyMeasurementStats = async (userId: string) => {
  const stat = await prisma.userMeasurementStat.findUnique({
    where: { userId },
  });

  return (
    stat || {
      userId,
      plotsCompleted: 0,
      calculationsCount: 0,
      lastActivityAt: new Date(),
    }
  );
};

const getAllMeasurementStats = async () => {
  const stats = await prisma.userMeasurementStat.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          imageUrl: true,
        },
      },
    },
    orderBy: { plotsCompleted: "desc" },
  });

  return stats;
};

export const calculationService = {
  createCalculation,
  getUserCalculations,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
  getMyMeasurementStats,
  getAllMeasurementStats,
};
