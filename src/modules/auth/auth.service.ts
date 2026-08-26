import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthProvider, type User } from '../../../generated/prisma/client';
import { env } from '../../config/index.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { jwtUtils } from '../../utils/jwt.js';
import type { PublicUser, RegisterPayload, TokenPair } from './auth.types.js';
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

const register = async (payload: RegisterPayload) => {
  const existing = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (existing) throw new AppError(httpStatus.CONFLICT, 'This email already exists');

  const passwordHash = await bcrypt.hash(payload.password, 12);
  const otp = await otpService.createRegistration({
    name: payload.name,
    email: payload.email,
    passwordHash,
  });
  await sendVerificationEmail(payload.email, otp);
  return { email: payload.email };
};

const verifyEmail = async (email: string, otp: string) => {
  const pendingUser = await otpService.validateOtp(email, otp);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError(httpStatus.CONFLICT, 'This email already exists');

  const user = await prisma.user.create({
    data: {
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.passwordHash,
      authProvider: AuthProvider.CREDENTIAL,
      emailVerified: true,
    },
  });
  await otpService.deleteRegistration(email);
  return { user: toPublicUser(user), tokens: createTokenPair(user) };
};

const resendOtp = async (email: string): Promise<void> => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (user) throw new AppError(httpStatus.BAD_REQUEST, 'Email is already registered');
  const otp = await otpService.resendOtp(email);
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
  jwtUtils.createToken({ id: user.id, type: 'oauth-exchange' }, env.JWT_ACCESS_SECRET, '60s');

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
