import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateSubscriptionInput,
  ExtendSubscriptionInput,
  GetSubscribersQueryInput,
  UpdateSubscriptionInput,
} from "./subscription.validation";
import { Prisma } from "../../../generated/prisma/client";

// 1. Create a subscription manually (Admin)
const createSubscription = async (payload: CreateSubscriptionInput) => {
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: payload.planId },
  });

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  const durationDays = payload.durationDays || plan.durationDays || 30;
  const startDate = new Date();
  const endDate = payload.endDate
    ? new Date(payload.endDate)
    : new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    const subscription = await tx.subscription.create({
      data: {
        userId: payload.userId,
        planId: payload.planId,
        status: "ACTIVE",
        startDate,
        endDate,
        paymentMethod: payload.paymentMethod || "MANUAL",
        transactionId: payload.transactionId || "",
        amountPaid: payload.amountPaid ?? plan.price,
        adminNote: payload.adminNote || "",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            status: true,
            isSubscribed: true,
          },
        },
        plan: true,
      },
    });

    // Update user isSubscribed status to true
    await tx.user.update({
      where: { id: payload.userId },
      data: { isSubscribed: true },
    });

    return subscription;
  });
};

// 2. Get all subscribers with filters and search (Admin)
const getAllSubscribers = async (query: GetSubscribersQueryInput) => {
  const { page, limit, searchTerm, status, planId, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.SubscriptionWhereInput[] = [];

  // Filter by status (if not ALL)
  if (status && status !== "ALL") {
    andConditions.push({ status });
  }

  // Filter by plan ID
  if (planId) {
    andConditions.push({ planId });
  }

  // Search in user name, email, phone, transactionId, plan name
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
        { user: { phone: { contains: term, mode: "insensitive" } } },
        { transactionId: { contains: term, mode: "insensitive" } },
        { plan: { name: { contains: term, mode: "insensitive" } } },
      ],
    });
  }

  const where: Prisma.SubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<
    string,
    Prisma.SubscriptionOrderByWithRelationInput[]
  > = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    expires_soon: [{ endDate: "asc" }],
    expires_latest: [{ endDate: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ createdAt: "desc" }];

  const [total, subscriptions] = await Promise.all([
    prisma.subscription.count({ where }),
    prisma.subscription.findMany({
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
            imageUrl: true,
            role: true,
            status: true,
            isSubscribed: true,
          },
        },
        plan: true,
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
    data: subscriptions,
  };
};

// 3. Get subscriber by ID
const getSubscriberById = async (id: string) => {
  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          imageUrl: true,
          role: true,
          status: true,
          isSubscribed: true,
        },
      },
      plan: true,
    },
  });

  if (!subscription) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found.");
  }

  return subscription;
};

// 4. Update subscription (Admin)
const updateSubscription = async (
  id: string,
  payload: UpdateSubscriptionInput,
) => {
  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        planId: payload.planId,
        status: payload.status,
        endDate: payload.endDate ? new Date(payload.endDate) : undefined,
        adminNote: payload.adminNote,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            status: true,
            isSubscribed: true,
          },
        },
        plan: true,
      },
    });

    // Check if user has active subscriptions
    const activeSubCount = await tx.subscription.count({
      where: { userId: existing.userId, status: "ACTIVE" },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: activeSubCount > 0 },
    });

    return updated;
  });
};

// 5. Revoke / Cancel subscription
const revokeSubscription = async (id: string) => {
  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    // Check if user has other active subscriptions
    const activeSubCount = await tx.subscription.count({
      where: { userId: existing.userId, status: "ACTIVE" },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: activeSubCount > 0 },
    });

    return updated;
  });
};

// 6. Extend subscription validity by X days
const extendSubscription = async (
  id: string,
  payload: ExtendSubscriptionInput,
) => {
  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription not found.");
  }

  const baseDate =
    new Date(existing.endDate) > new Date()
      ? new Date(existing.endDate)
      : new Date();

  const newEndDate = new Date(
    baseDate.getTime() + payload.days * 24 * 60 * 60 * 1000,
  );

  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        endDate: newEndDate,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            imageUrl: true,
            role: true,
            status: true,
            isSubscribed: true,
          },
        },
        plan: true,
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: true },
    });

    return updated;
  });
};

export const subscriptionService = {
  createSubscription,
  getAllSubscribers,
  getSubscriberById,
  updateSubscription,
  revokeSubscription,
  extendSubscription,
};

