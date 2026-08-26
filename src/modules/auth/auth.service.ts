import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import type { User } from '../../../generated/prisma/client';
import { env } from '../../config/index.js';
import { prisma } from '../../lib/prisma.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { AppError } from '../../utils/app-error.js';
import { jwtUtils } from '../../utils/jwt.js';
import type { PublicUser, TokenPair } from './auth.types.js';
import { otpService } from './otp.service.js';

const toPublicUser = (user: User): PublicUser => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  imageUrl: user.imageUrl,
});

const createTokenPair = (user: Pick<User, 'id' | 'email' | 'role'>): TokenPair => ({
  accessToken: jwtUtils.createToken(
    { id: user.id, email: user.email, role: user.role, type: 'access' },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
  ),
  refreshToken: jwtUtils.createToken(
    { id: user.id, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN,
  ),
});

const assertActiveUser = (user: User | null): User => {
  if (!user) throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  if (user.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');
  }
  if (!user.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified');
  }
  return user;
};

const register = async (input: { name: string; email: string; password: string }) => {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing?.emailVerified) {
    throw new AppError(httpStatus.CONFLICT, 'This email already exists');
  }

  const password = await bcrypt.hash(input.password, 12);
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { name: input.name, password, authProvider: 'CREDENTIAL' },
    });
  } else {
    await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        password,
        authProvider: 'CREDENTIAL',
        emailVerified: false,
      },
    });
  }

  const otp = await otpService.generateOtp(input.email);
  await sendVerificationEmail(input.email, otp);
  return { email: input.email };
};

const verifyEmail = async (email: string, otp: string) => {
  await otpService.validateOtp(email, otp);
  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });
  await otpService.deleteOtp(email);
  return { user: toPublicUser(user), tokens: createTokenPair(user) };
};

const resendOtp = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError(httpStatus.NOT_FOUND, 'User not found');
  if (user.emailVerified) throw new AppError(httpStatus.BAD_REQUEST, 'Email is already verified');
  const otp = await otpService.generateOtp(email);
  await sendVerificationEmail(email, otp);
};

const refresh = async (refreshToken: string) => {
  let payload: JwtPayload;
  try {
    payload = jwtUtils.verifyToken(refreshToken, env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is invalid or expired');
  }
  if (payload.type !== 'refresh' || typeof payload.id !== 'string') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is invalid');
  }
  const user = assertActiveUser(await prisma.user.findUnique({ where: { id: payload.id } }));
  return { user: toPublicUser(user), tokens: createTokenPair(user) };
};

const createGoogleExchangeCode = (user: Pick<User, 'id'>): string =>
  jwtUtils.createToken(
    { id: user.id, type: 'oauth-exchange' },
    env.JWT_ACCESS_SECRET,
    '60s',
  );

const exchangeGoogleCode = async (code: string) => {
  let payload: JwtPayload;
  try {
    payload = jwtUtils.verifyToken(code, env.JWT_ACCESS_SECRET);
  } catch {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in code is invalid or expired');
  }
  if (payload.type !== 'oauth-exchange' || typeof payload.id !== 'string') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in code is invalid');
  }
  const user = assertActiveUser(await prisma.user.findUnique({ where: { id: payload.id } }));
  return { user: toPublicUser(user), tokens: createTokenPair(user) };
};

export const authService = {
  assertActiveUser,
  createGoogleExchangeCode,
  createTokenPair,
  exchangeGoogleCode,
  refresh,
  register,
  resendOtp,
  toPublicUser,
  verifyEmail,
};
