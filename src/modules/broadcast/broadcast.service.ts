import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateBroadcastInput,
  GetBroadcastsQueryInput,
  UpdateBroadcastInput,
} from "./broadcast.validation";
import { Prisma } from "../../../generated/prisma/client";

// Helper: Seed initial broadcasts if table is empty
const seedDefaultBroadcastsIfEmpty = async () => {
  const count = await prisma.broadcast.count();
  if (count === 0) {
    await prisma.broadcast.createMany({
      data: [
        {
          title: "🎉 ২০২৮ সাল পর্যন্ত সকল প্রো ফিচার সম্পূর্ণ ফ্রি!",
          message:
            "মৌজা ম্যাপ প্রো-এর আর্লি অ্যাক্সেস ক্যাম্পেইনে যুক্ত হওয়া সকল ইউজার ও সার্ভেয়ার ২০২৮ সাল পর্যন্ত সমস্ত ল্যান্ড টুলস সম্পূর্ণ আনলিমিটেড ব্যবহার করতে পারবেন।",
          type: "PROMO",
          target: "ALL",
          isPinned: true,
          isActive: true,
          linkUrl: "/tools",
          linkText: "টুলস ব্যবহার করুন",
        },
        {
          title: "সার্ভেয়ার ভেরিফিকেশন ড্রাইভ চলছে",
          message:
            "অনলাইন ক্লায়েন্ট ও ভেরিফায়েড ব্যাজ পেতে আপনার এনআইডি ও সার্ভে সনদ আপলোড করে ভেরিফিকেশন আবেদন সম্পন্ন করুন।",
          type: "INFO",
          target: "SURVEYORS",
          isPinned: false,
          isActive: true,
          linkUrl: "/join-as-surveyor",
          linkText: "আবেদন করুন",
        },
      ],
    });
  }
};

// 1. Create broadcast (Admin)
const createBroadcast = async (payload: CreateBroadcastInput) => {
  const broadcast = await prisma.broadcast.create({
    data: {
      ...payload,
      expiresAt: payload.expiresAt ? new Date(payload.expiresAt) : null,
    },
  });

  return broadcast;
};

// 2. Get all broadcasts (Admin)
const getAllBroadcasts = async (query: GetBroadcastsQueryInput) => {
  await seedDefaultBroadcastsIfEmpty();

  const { page, limit, searchTerm, type, target, isActive, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.BroadcastWhereInput[] = [];

  // Filter by isActive
  if (isActive === "true") {
    andConditions.push({ isActive: true });
  } else if (isActive === "false") {
    andConditions.push({ isActive: false });
  }

  // Filter by Type
  if (type && type !== "ALL") {
    andConditions.push({ type });
  }

  // Filter by Target
  if (target && target !== "ALL") {
    andConditions.push({ target });
  }

  // Search by title or message
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { title: { contains: term, mode: "insensitive" } },
        { message: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.BroadcastWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<string, Prisma.BroadcastOrderByWithRelationInput[]> = {
    newest: [{ isPinned: "desc" }, { createdAt: "desc" }],
    oldest: [{ isPinned: "desc" }, { createdAt: "asc" }],
    pinned: [{ isPinned: "desc" }, { updatedAt: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ isPinned: "desc" }, { createdAt: "desc" }];

  const [total, broadcasts] = await Promise.all([
    prisma.broadcast.count({ where }),
    prisma.broadcast.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
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
    data: broadcasts,
  };
};

// 3. Get active broadcasts for public/users
const getActiveBroadcasts = async (targetUserRole?: string) => {
  await seedDefaultBroadcastsIfEmpty();

  const now = new Date();
  const targetFilter: Prisma.BroadcastWhereInput[] = [{ target: "ALL" }];

  if (targetUserRole === "SURVEYOR") {
    targetFilter.push({ target: "SURVEYORS" });
  } else if (targetUserRole === "USER") {
    targetFilter.push({ target: "USERS" });
  }

  const broadcasts = await prisma.broadcast.findMany({
    where: {
      isActive: true,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
      AND: [
        {
          OR: targetFilter,
        },
      ],
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
  });

  return broadcasts;
};

// 4. Get single broadcast by ID
const getBroadcastById = async (id: string) => {
  const broadcast = await prisma.broadcast.findUnique({
    where: { id },
  });

  if (!broadcast) {
    throw new AppError(httpStatus.NOT_FOUND, "Broadcast announcement not found.");
  }

  return broadcast;
};

// 5. Update broadcast (Admin)
const updateBroadcast = async (id: string, payload: UpdateBroadcastInput) => {
  const existing = await prisma.broadcast.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Broadcast announcement not found.");
  }

  const updated = await prisma.broadcast.update({
    where: { id },
    data: {
      ...payload,
      expiresAt:
        payload.expiresAt !== undefined
          ? payload.expiresAt
            ? new Date(payload.expiresAt)
            : null
          : undefined,
    },
  });

  return updated;
};

// 6. Toggle broadcast status (Admin)
const toggleBroadcastStatus = async (id: string) => {
  const existing = await prisma.broadcast.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Broadcast announcement not found.");
  }

  const updated = await prisma.broadcast.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });

  return updated;
};

// 7. Delete broadcast (Admin)
const deleteBroadcast = async (id: string) => {
  const existing = await prisma.broadcast.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Broadcast announcement not found.");
  }

  await prisma.broadcast.delete({
    where: { id },
  });

  return null;
};

export const broadcastService = {
  createBroadcast,
  getAllBroadcasts,
  getActiveBroadcasts,
  getBroadcastById,
  updateBroadcast,
  toggleBroadcastStatus,
  deleteBroadcast,
};

