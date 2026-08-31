import httpStatus from "http-status";
import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";
import { uploadToCloudinary, deleteFromCloudinary } from "../../lib/cloudinary";
import type {
  GetUsersQueryInput,
  CreateAdminInput,
  UpdateUserStatusInput,
  UpdateUserRoleInput,
} from "./user.validation";
import { Prisma } from "../../../generated/prisma/client";

// 1. Get all users with search, filter, pagination (excluding current user)
const getAllUsers = async (
  query: GetUsersQueryInput,
  currentUserId?: string,
) => {
  const { page, limit, searchTerm, role, status, sortBy } = query;
  const pageNum = Math.max(1, page || 1);
  const limitNum = Math.max(1, limit || 10);
  const skip = (pageNum - 1) * limitNum;

  const andConditions: Prisma.UserWhereInput[] = [];

  // Exclude current logged-in user
  if (currentUserId) {
    andConditions.push({ id: { not: currentUserId } });
  }

  // Search by name, email, or phone
  if (searchTerm?.trim()) {
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
    if (role === "ADMIN") {
      andConditions.push({ role: { in: ["ADMIN", "SUPER_ADMIN"] } });
    } else {
      andConditions.push({ role });
    }
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

// 2. Create new Admin user
const createAdmin = async (payload: CreateAdminInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: payload.email.toLowerCase().trim() },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A user with this email already exists.",
    );
  }

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  const admin = await prisma.user.create({
    data: {
      name: payload.name.trim(),
      email: payload.email.toLowerCase().trim(),
      password: hashedPassword,
      phone: payload.phone?.trim() || undefined,
      role: payload.role || "ADMIN",
      status: "ACTIVE",
      emailVerified: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      status: true,
      createdAt: true,
    },
  });

  return admin;
};

// 3. Get single user by ID
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

// 4. Update user status (ACTIVE | BLOCKED)
const updateUserStatus = async (
  id: string,
  payload: UpdateUserStatusInput,
  currentUser?: { id: string; role: string },
) => {
  if (currentUser && id === currentUser.id) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own status.",
    );
  }

  const targetUser = await getUserById(id);

  if (targetUser.role === "SUPER_ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Super Admin status cannot be changed.",
    );
  }

  if (targetUser.role === "ADMIN" && currentUser?.role !== "SUPER_ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Only a Super Admin can modify administrator status.",
    );
  }

  return prisma.user.update({
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
};

// 5. Update user role (USER | SURVEYOR | ADMIN | SUPER_ADMIN)
const updateUserRole = async (
  id: string,
  payload: UpdateUserRoleInput,
  currentUserId?: string,
) => {
  if (id === currentUserId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot change your own role.",
    );
  }

  await getUserById(id);

  return prisma.user.update({
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
};

// 6. Delete user
const deleteUser = async (id: string, currentUserId?: string) => {
  if (id === currentUserId) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "You cannot delete your own account.",
    );
  }

  const targetUser = await getUserById(id);

  if (targetUser.role === "SUPER_ADMIN") {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Super Admin accounts cannot be deleted.",
    );
  }

  await prisma.user.delete({ where: { id } });

  return null;
};

// 7. Upload & update profile image
const uploadProfileImage = async (userId: string, fileBuffer: Buffer) => {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      imagePublicId: true,
      imageUrl: true,
    },
  });

  if (!currentUser) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Upload to Cloudinary
  const cloudinaryResult = await uploadToCloudinary(fileBuffer, "mmp/profiles");

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      imageUrl: cloudinaryResult.secure_url,
      imagePublicId: cloudinaryResult.public_id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      imageUrl: true,
      imagePublicId: true,
      isSubscribed: true,
      phone: true,
      whatsappNumber: true,
      district: true,
      upazila: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // Clean up previous image on Cloudinary if exists
  if (currentUser.imagePublicId) {
    await deleteFromCloudinary(currentUser.imagePublicId);
  }

  return updatedUser;
};

export const userService = {
  getAllUsers,
  createAdmin,
  getUserById,
  updateUserStatus,
  updateUserRole,
  deleteUser,
  uploadProfileImage,
};
