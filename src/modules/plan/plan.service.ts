import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  CreatePlanInput,
  GetPlansQueryInput,
  UpdatePlanInput,
} from "./plan.validation";
import { Prisma } from "../../../generated/prisma/client";

const UNIFIED_PRO_FEATURES = [
  "সকল প্রো টুলস আনলিমিটেড অ্যাক্সেস",
  "জমির ক্ষেত্রফল ও প্যান্টাগ্রাফ টুল (C.S/B.S ম্যাপ এলাইনমেন্ট)",
  "ডিজিটাল ম্যাপ ট্রেসিং, ম্যাপ স্টুডিও ও মৌজা জিও স্টুডিও",
  "একাধিক প্লট আঁকা, নিখুঁত পরিমাপ ও KMZ এক্সপোর্ট",
  "সীমাহীন প্রজেক্ট স্টোরেজ, ডিভাইস সিঙ্ক ও ক্লাউড ব্যাকআপ",
  "PDF, PNG ও হাই-রেজোলিউশন প্রিন্ট রিপোর্ট (আনলিমিটেড)",
  "২৪/৭ প্রায়োরিটি সাপোর্ট ও সকল নতুন ফিচারে অগ্রাধিকার",
];

const UNIFIED_PRO_TOOLS = [
  "জমির ক্ষেত্রফল (প্লট মাপ ও ক্যালকুলেশন)",
  "প্যান্টাগ্রাফ (ম্যাপ স্কেল ও এলাইনমেন্ট)",
  "ডিজিটাল ম্যাপ ট্রেসিং",
  "মৌজা ম্যাপ স্টুডিও",
  "মৌজা জিও স্টুডিও",
];

// Default plans seed helper
const seedDefaultPlansIfEmpty = async () => {
  const count = await prisma.plan.count();
  if (count === 0) {
    await prisma.plan.createMany({
      data: [
        {
          name: "মাসিক প্রো",
          code: "pro_monthly",
          description: "স্বল্প সময়ের কাজ বা প্রথমবার প্রো ব্যবহার করার জন্য।",
          price: 299,
          originalPrice: 399,
          durationDays: 30,
          billingCycle: "MONTHLY",
          isPopular: false,
          isActive: true,
          sortOrder: 1,
          tools: UNIFIED_PRO_TOOLS,
          features: UNIFIED_PRO_FEATURES,
        },
        {
          name: "৬ মাস প্রো",
          code: "pro_6months",
          description: "নিয়মিত হিসাব ও রিপোর্ট তৈরি করা ব্যবহারকারীদের জন্য।",
          price: 999,
          originalPrice: 1499,
          discountBadge: "Save 33%",
          durationDays: 180,
          billingCycle: "SIX_MONTHS",
          isPopular: false,
          isActive: true,
          sortOrder: 2,
          tools: UNIFIED_PRO_TOOLS,
          features: UNIFIED_PRO_FEATURES,
        },
        {
          name: "বার্ষিক প্রো",
          code: "pro_yearly",
          description: "পেশাদার ও নিয়মিত ব্যবহারকারীদের জন্য সবচেয়ে সুবিধাজনক প্ল্যান।",
          price: 1599,
          originalPrice: 2499,
          discountBadge: "Best Value",
          durationDays: 365,
          billingCycle: "YEARLY",
          isPopular: true,
          isActive: true,
          sortOrder: 3,
          tools: UNIFIED_PRO_TOOLS,
          features: UNIFIED_PRO_FEATURES,
        },
      ],
    });
  }
};

// 1. Create a plan (Admin)
const createPlan = async (payload: CreatePlanInput) => {
  const existing = await prisma.plan.findUnique({
    where: { code: payload.code.trim().toLowerCase() },
  });

  if (existing) {
    throw new AppError(
      httpStatus.CONFLICT,
      `A plan with code "${payload.code}" already exists.`,
    );
  }

  const plan = await prisma.plan.create({
    data: {
      ...payload,
      code: payload.code.trim().toLowerCase(),
      name: payload.name.trim(),
    },
  });

  return plan;
};

// 2. Get all plans (Search, filter, sort)
const getAllPlans = async (query: GetPlansQueryInput) => {
  // Ensure default plans exist
  await seedDefaultPlansIfEmpty();

  const { page, limit, searchTerm, isActive, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 50);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.PlanWhereInput[] = [];

  // Filter by active status
  if (isActive === "true") {
    andConditions.push({ isActive: true });
  } else if (isActive === "false") {
    andConditions.push({ isActive: false });
  }

  // Search by name, code, description
  if (searchTerm?.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { code: { contains: term, mode: "insensitive" } },
        { description: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  const where: Prisma.PlanWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<string, Prisma.PlanOrderByWithRelationInput[]> = {
    sortOrder: [{ sortOrder: "asc" }, { price: "asc" }],
    price_asc: [{ price: "asc" }],
    price_desc: [{ price: "desc" }],
    newest: [{ createdAt: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ sortOrder: "asc" }];

  const [total, plans] = await Promise.all([
    prisma.plan.count({ where }),
    prisma.plan.findMany({
      where,
      skip,
      take: limitNum,
      orderBy,
      include: {
        _count: {
          select: {
            subscriptions: true,
          },
        },
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
    data: plans,
  };
};

// 3. Get single plan by ID or Code
const getPlanById = async (id: string) => {
  const plan = await prisma.plan.findFirst({
    where: {
      OR: [{ id }, { code: id }],
    },
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
  });

  if (!plan) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  return plan;
};

// 4. Update plan (Admin)
const updatePlan = async (id: string, payload: UpdatePlanInput) => {
  const existing = await prisma.plan.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  // If code changed, check uniqueness
  if (payload.code && payload.code.trim().toLowerCase() !== existing.code) {
    const duplicate = await prisma.plan.findUnique({
      where: { code: payload.code.trim().toLowerCase() },
    });
    if (duplicate) {
      throw new AppError(
        httpStatus.CONFLICT,
        `A plan with code "${payload.code}" already exists.`,
      );
    }
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: {
      ...payload,
      code: payload.code ? payload.code.trim().toLowerCase() : undefined,
      name: payload.name ? payload.name.trim() : undefined,
    },
  });

  return updated;
};

// 5. Toggle plan active status
const togglePlanStatus = async (id: string) => {
  const existing = await prisma.plan.findUnique({
    where: { id },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  const updated = await prisma.plan.update({
    where: { id },
    data: {
      isActive: !existing.isActive,
    },
  });

  return updated;
};

// 6. Delete plan (Admin)
const deletePlan = async (id: string) => {
  const existing = await prisma.plan.findUnique({
    where: { id },
    include: {
      _count: {
        select: { subscriptions: true },
      },
    },
  });

  if (!existing) {
    throw new AppError(httpStatus.NOT_FOUND, "Plan not found.");
  }

  if (existing._count.subscriptions > 0) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Cannot delete plan because it has active subscriptions. Consider deactivating it instead.",
    );
  }

  await prisma.plan.delete({
    where: { id },
  });

  return null;
};

// Settings & Grantor for Auto Pro on Registration
const isAutoProOnRegisterEnabled = async (): Promise<boolean> => {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: "AUTO_PRO_ON_REGISTER" },
    });
    if (!setting) {
      return true; // Default to enabled
    }
    return setting.value === "true";
  } catch {
    return true;
  }
};

const getAutoProSetting = async () => {
  const isEnabled = await isAutoProOnRegisterEnabled();
  const planSetting = await prisma.systemSetting.findUnique({
    where: { key: "AUTO_PRO_PLAN_ID" },
  });

  let selectedPlanId = planSetting?.value || null;

  if (!selectedPlanId) {
    const defaultPlan = await prisma.plan.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
    selectedPlanId = defaultPlan?.id || null;
  }

  return {
    autoProOnRegister: isEnabled,
    autoProPlanId: selectedPlanId,
  };
};

const setAutoProSetting = async (payload: {
  enabled?: boolean;
  planId?: string | null;
}) => {
  let isEnabled = payload.enabled;

  if (isEnabled === undefined && payload.planId) {
    isEnabled = true;
  }

  if (isEnabled !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "AUTO_PRO_ON_REGISTER" },
      update: { value: String(isEnabled) },
      create: { key: "AUTO_PRO_ON_REGISTER", value: String(isEnabled) },
    });
  }

  if (payload.planId !== undefined) {
    await prisma.systemSetting.upsert({
      where: { key: "AUTO_PRO_PLAN_ID" },
      update: { value: payload.planId || "" },
      create: { key: "AUTO_PRO_PLAN_ID", value: payload.planId || "" },
    });
  }

  return getAutoProSetting();
};

const UNLIMITED_PRO_END_DATE = new Date("2125-12-31T23:59:59.999Z");

const grantAutoProSubscription = async (
  userId: string,
  tx: Prisma.TransactionClient,
): Promise<boolean> => {
  const enabledSetting = await tx.systemSetting.findUnique({
    where: { key: "AUTO_PRO_ON_REGISTER" },
  });

  const isAutoProEnabled =
    !enabledSetting || enabledSetting.value === "true";

  if (!isAutoProEnabled) {
    return false;
  }

  const planSetting = await tx.systemSetting.findUnique({
    where: { key: "AUTO_PRO_PLAN_ID" },
  });

  let proPlan = planSetting?.value
    ? await tx.plan.findUnique({
        where: { id: planSetting.value },
      })
    : null;

  if (!proPlan || !proPlan.isActive) {
    proPlan = await tx.plan.findFirst({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    });
  }

  if (!proPlan) {
    return false;
  }

  const endDate =
    proPlan.billingCycle === "LIFETIME" || proPlan.durationDays >= 3650
      ? UNLIMITED_PRO_END_DATE
      : new Date(
          Date.now() + proPlan.durationDays * 24 * 60 * 60 * 1000,
        );

  await tx.subscription.create({
    data: {
      userId,
      planId: proPlan.id,
      status: "ACTIVE",
      startDate: new Date(),
      endDate,
      paymentMethod: "REGISTRATION_BONUS",
      transactionId: `REG_BONUS_${Date.now()}`,
      amountPaid: 0,
      adminNote: `Auto Registration Bonus: ${proPlan.name} (${proPlan.durationDays} days)`,
    },
  });

  await tx.user.update({
    where: { id: userId },
    data: { isSubscribed: true },
  });

  return true;
};

export const planService = {
  createPlan,
  getAllPlans,
  getPlanById,
  updatePlan,
  togglePlanStatus,
  deletePlan,
  isAutoProOnRegisterEnabled,
  getAutoProSetting,
  setAutoProSetting,
  grantAutoProSubscription,
};
