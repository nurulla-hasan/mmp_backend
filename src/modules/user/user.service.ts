import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import type {
  GetUsersQueryInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from "./user.validation";
import { Prisma } from "../../../generated/prisma/client";

// 1. Get all users with search, filter, pagination, excluding current admin
const getAllUsers = async (
  query: GetUsersQueryInput,
  currentAdminId?: string,
) => {
  const { page, limit, searchTerm, role, status, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.UserWhereInput[] = [];

  // Exclude the currently logged-in admin from user management list
  if (currentAdminId) {
    andConditions.push({ id: { not: currentAdminId } });
  }

  // Search by name, email, or phone
  if (searchTerm && searchTerm.trim()) {
    const term = searchTerm.trim();
    andConditions.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { phone: { contains: term, mode: "insensitive" } },
      ],
    });
  }

  // Filter by Role
  if (role) {
    andConditions.push({ role });
  }

  // Filter by Status
  if (status) {
    andConditions.push({ status });
  }

  const whereCondition: Prisma.UserWhereInput =
    andConditions.length > 0 ? { AND: andConditions } : {};

  // Sorting
  const orderByMap: Record<string, Prisma.UserOrderByWithRelationInput[]> = {
    newest: [{ createdAt: "desc" }],
    oldest: [{ createdAt: "asc" }],
    name_asc: [{ name: "asc" }],
    name_desc: [{ name: "desc" }],
  };

  const orderBy = orderByMap[sortBy] || [{ createdAt: "desc" }];

  const [total, rawUsers] = await Promise.all([
    prisma.user.count({ where: whereCondition }),
    prisma.user.findMany({
      where: whereCondition,
      skip,
      take: limitNum,
      orderBy,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        phone: true,
        whatsappNumber: true,
        district: true,
        upazila: true,
        imageUrl: true,
        isSubscribed: true,
        emailVerified: true,
        createdAt: true,
        measurementStat: {
          select: {
            plotsCompleted: true,
            calculationsCount: true,
            lastActivityAt: true,
          },
        },
      },
    }),
  ]);

  // Format users for client consumption
  const users = rawUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    phone: user.phone,
    whatsappNumber: user.whatsappNumber,
    district: user.district,
    upazila: user.upazila,
    imageUrl: user.imageUrl,
    isSubscribed: user.isSubscribed,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt,
    plotsMeasured: user.measurementStat?.plotsCompleted || 0,
    calculationsSaved: user.measurementStat?.calculationsCount || 0,
    lastMeasurementAt: user.measurementStat?.lastActivityAt || null,
  }));

  const totalPages = Math.ceil(total / limitNum);

  return {
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages,
    },
    data: users,
  };
};

// 2. Get single user by ID
const getUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      phone: true,
      whatsappNumber: true,
      district: true,
      upazila: true,
      imageUrl: true,
      isSubscribed: true,
      emailVerified: true,
      createdAt: true,
      updatedAt: true,
      measurementStat: true,
      surveyorProfile: {
        select: {
          id: true,
          slug: true,
          experienceYears: true,
          verificationStatus: true,
        },
      },
      _count: {
        select: {
          calculations: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  return user;
};

// 3. Update user status (ACTIVE | BLOCKED)
const updateUserStatus = async (
  id: string,
  payload: UpdateUserStatusInput,
  currentAdminId?: string,
) => {
  if (currentAdminId && id === currentAdminId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot modify the status of your own account.",
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { status: payload.status },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

// 4. Update user role (USER | SURVEYOR | ADMIN)
const updateUserRole = async (
  id: string,
  payload: UpdateUserRoleInput,
  currentAdminId?: string,
) => {
  if (currentAdminId && id === currentAdminId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot modify the role of your own account.",
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { role: payload.role },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
    },
  });

  return updatedUser;
};

// 5. Delete user
const deleteUser = async (id: string, currentAdminId?: string) => {
  if (currentAdminId && id === currentAdminId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot delete your own account.",
    );
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  await prisma.user.delete({ where: { id } });

  return null;
};

export const userService = {
  getAllUsers,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
};
