import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateCalculationInput,
  GetCalculationsQueryInput,
  UpdateCalculationInput,
} from "./calculation.validation";

const createCalculation = async (
  userId: string,
  data: CreateCalculationInput,
) => {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create calculation with nested plots
    const calculation = await tx.calculation.create({
      data: {
        userId,
        name: data.name,
        mapName: data.mapName,
        scaleType: data.scaleType,
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

const incrementPlotCount = async (userId: string) => {
  const stat = await prisma.userMeasurementStat.upsert({
    where: { userId },
    create: {
      userId,
      plotsCompleted: 1,
      calculationsCount: 0,
      lastActivityAt: new Date(),
    },
    update: {
      plotsCompleted: {
        increment: 1,
      },
      lastActivityAt: new Date(),
    },
  });

  return stat;
};

const getUserCalculations = async (
  userId: string,
  query: GetCalculationsQueryInput,
) => {
  const { page, limit, searchTerm, sortBy } = query;
  const skip = (page - 1) * limit;

  // Build where conditions
  const where: Record<string, unknown> = { userId };

  if (searchTerm) {
    where.OR = [
      { name: { contains: searchTerm, mode: "insensitive" } },
      { mapName: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Build sort condition
  let orderBy: Record<string, "asc" | "desc"> = { createdAt: "desc" };
  if (sortBy === "oldest") {
    orderBy = { createdAt: "asc" };
  } else if (sortBy === "name_asc") {
    orderBy = { name: "asc" };
  } else if (sortBy === "name_desc") {
    orderBy = { name: "desc" };
  }

  const [total, calculations] = await Promise.all([
    prisma.calculation.count({ where }),
    prisma.calculation.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        plots: {
          orderBy: { createdAt: "asc" },
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    meta: {
      page,
      limit,
      total,
      totalPages,
    },
    data: calculations,
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
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });

  if (!calculation) {
    throw new AppError(httpStatus.NOT_FOUND, "Calculation record not found.");
  }

  // Check ownership unless admin
  if (userRole !== "ADMIN" && calculation.userId !== userId) {
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
    include: { plots: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Calculation record not found.");
  }

  if (existing.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You do not have permission to update this calculation.",
    );
  }

  const result = await prisma.$transaction(async (tx) => {
    // If plots array is provided, replace existing plots
    let plotsCreatedCount = 0;
    if (data.plots) {
      await tx.plot.deleteMany({
        where: { calculationId: id },
      });

      if (data.plots.length > 0) {
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
    }

    // Update parent calculation
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

  if (userRole !== "ADMIN" && existing.userId !== userId) {
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
  incrementPlotCount,
  getUserCalculations,
  getCalculationById,
  updateCalculation,
  deleteCalculation,
  getMyMeasurementStats,
  getAllMeasurementStats,
};
