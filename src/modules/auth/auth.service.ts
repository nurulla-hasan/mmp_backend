import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthProvider, type User } from '../../../generated/prisma/client';

import { env } from '../../config/index';
import { sendVerificationEmail, sendPasswordResetEmail } from '../../lib/email';
import { prisma } from '../../lib/prisma';
import { AppError } from '../../utils/app-error';
import { jwtUtils } from '../../utils/jwt';

import type { IRegisterUser } from './auth.types';
import type {
  UpdateMeInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from './auth.validation';
import { otpService } from './otp.service';
import { planService } from '../plan/plan.service';

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
      isSubscribed: true,
    },
  });

  // Grant promotional free pro subscription till 2028
  await planService.grantFreeProSubscriptionTill2028(user.id);

  // Delete pending user data from Redis after user is created in database
  await otpService.deletePendingUser(email);

  const jwtPayload = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    isSubscribed: true,
  };

  const accessToken = jwtUtils.createToken(jwtPayload, env.JWT_ACCESS_SECRET, env.JWT_ACCESS_EXPIRES_IN);
  const refreshToken = jwtUtils.createToken(jwtPayload, env.JWT_REFRESH_SECRET, env.JWT_REFRESH_EXPIRES_IN);

  return {
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

  if (!rawUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (rawUser.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');
  }

  const user = rawUser;

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

  if (!rawUser) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (rawUser.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');
  }

  const user = rawUser;

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
    accessToken,
    refreshToken,
  };
};

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      surveyorProfile: {
        include: {
          surveyorServices: { include: { service: true } },
          serviceAreas: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  }

  const { password, googleId, imagePublicId, ...safeUser } = user;

  return {
    ...safeUser,
    hasPassword: Boolean(password),
  };
};

const updateMe = async (userId: string, payload: UpdateMeInput) => {
  const user = await prisma.user.update({
    where: { id: userId },
    data: payload,
    omit: {
      password: true,
      googleId: true,
      imagePublicId: true,
      authProvider: true,
    },
    include: {
      surveyorProfile: {
        include: {
          surveyorServices: { include: { service: true } },
          serviceAreas: true,
        },
      },
    },
  });

  return user;
};

const changePassword = async (userId: string, payload: ChangePasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, password: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  if (user.password) {
    if (!payload.oldPassword) {
      throw new AppError(httpStatus.BAD_REQUEST, "Current password is required.");
    }
    const isMatch = await bcrypt.compare(payload.oldPassword, user.password);
    if (!isMatch) {
      throw new AppError(httpStatus.BAD_REQUEST, "Current password does not match.");
    }

    const isSame = await bcrypt.compare(payload.newPassword, user.password);
    if (isSame) {
      throw new AppError(httpStatus.BAD_REQUEST, "New password cannot be the same as current password.");
    }
  }

  const hashedPassword = await bcrypt.hash(payload.newPassword, 12);

  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully." };
};

const forgotPassword = async (payload: ForgotPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "এই ইমেইল ঠিকানায় কোনো অ্যাকাউন্ট খুঁজে পাওয়া যায়নি।");
  }

  if (user.status === "BLOCKED") {
    throw new AppError(httpStatus.FORBIDDEN, "আপনার অ্যাকাউন্টটি সাময়িকভাবে স্থগিত রয়েছে।");
  }

  const otp = await otpService.savePasswordResetOtp(user.email);
  await sendPasswordResetEmail(user.email, otp);

  return { message: "আপনার ইমেইলে ৬-ডিজিটের ভেরিফিকেশন কোড পাঠানো হয়েছে।" };
};

const resendPasswordResetOtp = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  const newOtp = await otpService.resendPasswordResetOtp(email);
  await sendPasswordResetEmail(email, newOtp);

  return { message: "নতুন ভেরিফিকেশন কোড পুনরায় পাঠানো হয়েছে।" };
};

const resetPassword = async (payload: ResetPasswordInput) => {
  const user = await prisma.user.findUnique({
    where: { email: payload.email },
    select: { id: true, email: true, status: true },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  // Verify OTP
  await otpService.verifyPasswordResetOtp(payload.email, payload.otp);

  const hashedPassword = await bcrypt.hash(payload.password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashedPassword },
  });

  await otpService.deletePasswordResetOtp(payload.email);

  return { message: "পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে। এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।" };
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
  updateMe,
  changePassword,
  forgotPassword,
  resendPasswordResetOtp,
  resetPassword,
};
