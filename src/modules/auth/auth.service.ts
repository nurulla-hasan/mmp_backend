import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthProvider, type User } from '../../../generated/prisma/client';

import { env } from '../../config/index.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { jwtUtils } from '../../utils/jwt.js';

import type { IRegisterUser } from './auth.types.js';
import { ensureActiveUser } from './auth.utils.js';
import { otpService } from './otp.service.js';

const loginUser = (user: User) => {
  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtUtils.createToken(jwtPayload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = jwtUtils.createToken(jwtPayload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      isSubscribed: user.isSubscribed,
      imageUrl: user.imageUrl ,
      phone: user.phone ,
      whatsappNumber: user.whatsappNumber ,
      district: user.district ,
      upazila: user.upazila ,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

const registerUser = async (payload: IRegisterUser): Promise<{ email: string }> => {
  const { name, email, password } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'This email already exists');
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const otp = await otpService.savePendingUser({
    name,
    email,
    passwordHash,
  });

  await sendVerificationEmail(email, otp);

  return { email };
};

const verifyEmailAndCreateUser = async (email: string, otp: string) => {
  const pendingUser = await otpService.verifyRegistrationOtp(email, otp);

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'This email already exists');
  }

  const user = await prisma.user.create({
    data: {
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.passwordHash,
      authProvider: AuthProvider.CREDENTIAL,
      emailVerified: true,
    },
  });

  // Delete pending user data from Redis after user is created in database
  await otpService.deletePendingUser(email);

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtUtils.createToken(jwtPayload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = jwtUtils.createToken(jwtPayload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      isSubscribed: user.isSubscribed,
      imageUrl: user.imageUrl,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
      district: user.district,
      upazila: user.upazila,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

const resendVerificationOtp = async (email: string): Promise<void> => {
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered');
  }

  const newOtp = await otpService.resendRegistrationOtp(email);

  await sendVerificationEmail(email, newOtp);
};

const refreshAuthTokens = async (refreshToken: string) => {
  let tokenPayload: JwtPayload;

  try {
    tokenPayload = jwtUtils.verifyToken(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is invalid or expired');
  }

  const rawUser = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
  });

  const user = ensureActiveUser(rawUser);

  if (!user.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified');
  }

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtUtils.createToken(jwtPayload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const newRefreshToken = jwtUtils.createToken(jwtPayload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      isSubscribed: user.isSubscribed,
      imageUrl: user.imageUrl,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
      district: user.district,
      upazila: user.upazila,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken: newRefreshToken,
  };
};

const createGoogleLoginCode = (user: User): string => {
  return jwtUtils.createToken(
    {
      id: user.id,
      type: 'oauth-exchange',
    },
    env.JWT_ACCESS_SECRET,
    '60s',
  );
};

const exchangeGoogleLoginCode = async (code: string) => {
  let tokenPayload: JwtPayload;

  try {
    tokenPayload = jwtUtils.verifyToken(code, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in code is invalid or expired');
  }

  if (tokenPayload.type !== 'oauth-exchange' || typeof tokenPayload.id !== 'string') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in code is invalid');
  }

  const rawUser = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
  });

  const user = ensureActiveUser(rawUser);

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isSubscribed: user.isSubscribed,
  };

  const accessToken = jwtUtils.createToken(jwtPayload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = jwtUtils.createToken(jwtPayload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      emailVerified: user.emailVerified,
      isSubscribed: user.isSubscribed,
      imageUrl: user.imageUrl,
      phone: user.phone,
      whatsappNumber: user.whatsappNumber,
      district: user.district,
      upazila: user.upazila,
      createdAt: user.createdAt,
    },
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  const rawUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!rawUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  return {
    id: rawUser.id,
    name: rawUser.name,
    email: rawUser.email,
    role: rawUser.role,
    status: rawUser.status,
    emailVerified: rawUser.emailVerified,
    isSubscribed: rawUser.isSubscribed,
    imageUrl: rawUser.imageUrl,
    phone: rawUser.phone,
    whatsappNumber: rawUser.whatsappNumber,
    district: rawUser.district,
    upazila: rawUser.upazila,
    createdAt: rawUser.createdAt,
  };
};

export const authService = {
  loginUser,
  registerUser,
  verifyEmailAndCreateUser,
  resendVerificationOtp,
  refreshAuthTokens,
  createGoogleLoginCode,
  exchangeGoogleLoginCode,
  getMe,
};
