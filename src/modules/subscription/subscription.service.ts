import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreateSubscriptionInput,
  ExtendSubscriptionInput,
  GetSubscribersQueryInput,
  ManualCheckoutInput,
  UpdatePaymentNumbersInput,
  UpdateSubscriptionInput,
} from "./subscription.validation";
import { Prisma } from "../../../generated/prisma/client";

const UNLIMITED_PRO_END_DATE = new Date("2125-12-31T23:59:59.999Z");

// 1. Get Payment Numbers & Instructions (Public / Auth)
const getPaymentNumbers = async () => {
  const [bkashSetting, nagadSetting, rocketSetting, instructionsSetting] =
    await Promise.all([
      prisma.systemSetting.findUnique({
        where: { key: "MANUAL_PAYMENT_BKASH" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "MANUAL_PAYMENT_NAGAD" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "MANUAL_PAYMENT_ROCKET" },
      }),
      prisma.systemSetting.findUnique({
        where: { key: "MANUAL_PAYMENT_INSTRUCTIONS" },
      }),
    ]);

  return {
    bkashNumber:
      bkashSetting?.value || "01750-974716 (Personal / Send Money)",
    nagadNumber:
      nagadSetting?.value || "01750-974716 (Personal / Send Money)",
    rocketNumber: rocketSetting?.value || "",
    instructions:
      instructionsSetting?.value ||
      "Please Send Money to the bKash or Nagad number above. After sending, enter your sender phone number and Transaction ID (TrxID) below to submit your payment request. Your subscription will be activated upon admin approval.",
  };
};

// 2. Update Payment Numbers & Instructions (Admin)
const updatePaymentNumbers = async (payload: UpdatePaymentNumbersInput) => {
  if (payload.bkashNumber !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "MANUAL_PAYMENT_BKASH" },
      update: { value: payload.bkashNumber },
      create: { key: "MANUAL_PAYMENT_BKASH", value: payload.bkashNumber },
    });
  }

  if (payload.nagadNumber !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "MANUAL_PAYMENT_NAGAD" },
      update: { value: payload.nagadNumber },
      create: { key: "MANUAL_PAYMENT_NAGAD", value: payload.nagadNumber },
    });
  }

  if (payload.rocketNumber !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "MANUAL_PAYMENT_ROCKET" },
      update: { value: payload.rocketNumber },
      create: { key: "MANUAL_PAYMENT_ROCKET", value: payload.rocketNumber },
    });
  }

  if (payload.instructions !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "MANUAL_PAYMENT_INSTRUCTIONS" },
      update: { value: payload.instructions },
      create: { key: "MANUAL_PAYMENT_INSTRUCTIONS", value: payload.instructions },
    });
  }

  return getPaymentNumbers();
};

// 3. User submits manual payment checkout request
const submitManualCheckout = async (
  userId: string,
  payload: ManualCheckoutInput,
) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const plan = await prisma.plan.findUnique({
    where: { id: payload.planId },
  });

  if (!plan || !plan.isActive) {
    throw new AppError(httpStatus.BAD_REQUEST, "Selected plan is not available.");
  }

  const now = new Date();
  // Check if user already has an active subscription with remaining days
  const currentActiveSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gt: now },
    },
    orderBy: { endDate: "desc" },
  });

  const startDate = now;
  const baseDate = currentActiveSub && currentActiveSub.endDate > now ? currentActiveSub.endDate : now;
  let endDate: Date;
  if (plan.billingCycle === "LIFETIME" || plan.durationDays >= 3650) {
    endDate = UNLIMITED_PRO_END_DATE;
  } else {
    endDate = new Date(
      baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planId: plan.id,
      status: "PENDING",
      startDate,
      endDate,
      paymentMethod: payload.paymentMethod,
      transactionId: payload.transactionId.trim(),
      senderPhone: payload.senderPhone.trim(),
      amountPaid: plan.price,
      adminNote: `Submitted via Manual Payment (${payload.paymentMethod})`,
    },
    include: {
      plan: true,
    },
  });

  return subscription;
};

// 4. Get Current User's active & pending subscription info
const getMySubscription = async (userId: string) => {
  const activeSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "ACTIVE",
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  const pendingSub = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
    include: { plan: true },
  });

  return {
    activeSubscription: activeSub,
    pendingSubscription: pendingSub,
    isSubscribed: Boolean(activeSub),
  };
};

// 5. Admin Approves Subscription Request
const approveSubscription = async (id: string, adminNote?: string) => {
  const existing = await prisma.subscription.findUnique({
    where: { id },
    include: { plan: true },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription request not found.");
  }

  const now = new Date();
  // Find current active subscription with remaining days
  const currentActiveSub = await prisma.subscription.findFirst({
    where: {
      userId: existing.userId,
      status: "ACTIVE",
      endDate: { gt: now },
      id: { not: existing.id },
    },
    orderBy: { endDate: "desc" },
  });

  const plan = existing.plan;
  const startDate = now;
  // If user already had remaining days, add new plan duration to existing endDate!
  const baseDate = currentActiveSub && currentActiveSub.endDate > now ? currentActiveSub.endDate : now;
  let endDate: Date;

  if (plan.billingCycle === "LIFETIME" || plan.durationDays >= 3650) {
    endDate = UNLIMITED_PRO_END_DATE;
  } else {
    endDate = new Date(
      baseDate.getTime() + plan.durationDays * 24 * 60 * 60 * 1000,
    );
  }

  return prisma.$transaction(async (tx) => {
    // If there was an older active subscription, mark it as EXPIRED
    if (currentActiveSub) {
      await tx.subscription.update({
        where: { id: currentActiveSub.id },
        data: { status: "EXPIRED" },
      });
    }

    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "ACTIVE",
        startDate,
        endDate,
        adminNote: adminNote || existing.adminNote || "Approved by Admin",
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

// 6. Admin Rejects Subscription Request
const rejectSubscription = async (id: string, adminNote: string) => {
  const existing = await prisma.subscription.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Subscription request not found.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.subscription.update({
      where: { id },
      data: {
        status: "CANCELLED",
        adminNote: adminNote || "Rejected by Admin",
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

    // Check if user still has other active subscriptions
    const otherActiveCount = await tx.subscription.count({
      where: {
        userId: existing.userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: otherActiveCount > 0 },
    });

    return updated;
  });
};

// 7. Create a subscription manually (Admin)
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

  const now = new Date();
  const currentActiveSub = await prisma.subscription.findFirst({
    where: {
      userId: payload.userId,
      status: "ACTIVE",
      endDate: { gt: now },
    },
    orderBy: { endDate: "desc" },
  });

  const durationDays = payload.durationDays || plan.durationDays || 30;
  const startDate = now;
  const baseDate = payload.endDate
    ? new Date(payload.endDate)
    : currentActiveSub && currentActiveSub.endDate > now
    ? currentActiveSub.endDate
    : startDate;

  const endDate = payload.endDate
    ? new Date(payload.endDate)
    : new Date(baseDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    if (currentActiveSub && !payload.endDate) {
      await tx.subscription.update({
        where: { id: currentActiveSub.id },
        data: { status: "EXPIRED" },
      });
    }

    const subscription = await tx.subscription.create({
      data: {
        userId: payload.userId,
        planId: payload.planId,
        status: "ACTIVE",
        startDate,
        endDate,
        paymentMethod: payload.paymentMethod || "MANUAL",
        transactionId: payload.transactionId || "",
        senderPhone: payload.senderPhone || "",
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

// 8. Get all subscribers with filters and search (Admin)
const getAllSubscribers = async (
  query: GetSubscribersQueryInput & { history?: string },
) => {
  const { page, limit, searchTerm, status, planId, sortBy, history } = query;
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

  // Search in user name, email, phone, transactionId, senderPhone, plan name
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { user: { name: { contains: term, mode: "insensitive" } } },
        { user: { email: { contains: term, mode: "insensitive" } } },
        { user: { phone: { contains: term, mode: "insensitive" } } },
        { transactionId: { contains: term, mode: "insensitive" } },
        { senderPhone: { contains: term, mode: "insensitive" } },
        { plan: { name: { contains: term, mode: "insensitive" } } },
        { plan: { code: { contains: term, mode: "insensitive" } } },
      ],
    });
  }

  const whereCondition: Prisma.SubscriptionWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // If history is requested, return all records
  if (history === "true") {
    let orderBy: Prisma.SubscriptionOrderByWithRelationInput = {
      createdAt: "desc",
    };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    else if (sortBy === "expires_soon") orderBy = { endDate: "asc" };
    else if (sortBy === "expires_latest") orderBy = { endDate: "desc" };

    const [subscribers, total] = await Promise.all([
      prisma.subscription.findMany({
        where: whereCondition,
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
        orderBy,
        skip,
        take: limitNum,
      }),
      prisma.subscription.count({ where: whereCondition }),
    ]);

    return {
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
      data: subscribers,
    };
  }

  // Default: Unique subscribers (1 row per user)
  const allMatchingSubs = await prisma.subscription.findMany({
    where: whereCondition,
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
    orderBy: { createdAt: "desc" },
  });

  // Deduplicate by userId, keeping the most relevant (ACTIVE first, then PENDING, then latest)
  const userMap = new Map<string, (typeof allMatchingSubs)[0]>();
  for (const sub of allMatchingSubs) {
    const existing = userMap.get(sub.userId);
    if (!existing) {
      userMap.set(sub.userId, sub);
    } else if (existing.status !== "ACTIVE" && sub.status === "ACTIVE") {
      userMap.set(sub.userId, sub);
    }
  }

  const uniqueSubscribers = Array.from(userMap.values());
  const total = uniqueSubscribers.length;
  const paginatedData = uniqueSubscribers.slice(skip, skip + limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
    data: paginatedData,
  };
};

// 9. Get single subscriber by ID
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
          createdAt: true,
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

// 10. Update subscriber info
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

    const activeSubCount = await tx.subscription.count({
      where: {
        userId: existing.userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: activeSubCount > 0 },
    });

    return updated;
  });
};

// 11. Revoke / Cancel subscription
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

    const activeSubCount = await tx.subscription.count({
      where: {
        userId: existing.userId,
        status: "ACTIVE",
        endDate: { gte: new Date() },
      },
    });

    await tx.user.update({
      where: { id: existing.userId },
      data: { isSubscribed: activeSubCount > 0 },
    });

    return updated;
  });
};

// 12. Extend subscription validity by X days
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
  getPaymentNumbers,
  updatePaymentNumbers,
  submitManualCheckout,
  getMySubscription,
  approveSubscription,
  rejectSubscription,
  createSubscription,
  getAllSubscribers,
  getSubscriberById,
  updateSubscription,
  revokeSubscription,
  extendSubscription,
};
