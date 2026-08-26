import bcrypt from 'bcryptjs';
import httpStatus from 'http-status';
import type { JwtPayload } from 'jsonwebtoken';
import { AuthProvider, type User } from '../../../generated/prisma/client';
import { env } from '../../config/index.js';
import { sendVerificationEmail } from '../../lib/email.js';
import { prisma } from '../../lib/prisma.js';
import { AppError } from '../../utils/app-error.js';
import { jwtUtils } from '../../utils/jwt.js';
import type { IAuthTokens, IPublicUser, IRegisterUser } from './auth.types.js';
import { otpService } from './otp.service.js';

const getPublicUser = (user: User): IPublicUser => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    imageUrl: user.imageUrl,
  };
};

const createAuthTokens = (user: Pick<User, 'id' | 'email' | 'role'>): IAuthTokens => {
  const accessToken = jwtUtils.createToken(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      type: 'access',
    },
    env.JWT_ACCESS_SECRET,
    env.JWT_ACCESS_EXPIRES_IN,
  );

  const refreshToken = jwtUtils.createToken(
    {
      id: user.id,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN,
  );

  return {
    accessToken,
    refreshToken,
  };
};

const checkUserCanLogin = (user: User | null): User => {
  if (!user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  if (user.status !== 'ACTIVE') {
    throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified');
  }

  return user;
};

const registerUser = async (payload: IRegisterUser) => {
  const { name, email, password } = payload;

  // Step 1: Make sure the email is not already registered.
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'This email already exists');
  }

  // Step 2: Hash the password before saving it in Redis.
  const passwordHash = await bcrypt.hash(password, 12);

  // Step 3: Keep the pending user and OTP in Redis for 5 minutes.
  const otp = await otpService.savePendingUser({
    name,
    email,
    passwordHash,
  });

  // Step 4: Send the OTP to the user's email.
  await sendVerificationEmail(email, otp);

  return { email };
};

const verifyEmailAndCreateUser = async (email: string, otp: string) => {
  // Step 1: Verify the OTP and get the pending user from Redis.
  const pendingUser = await otpService.verifyRegistrationOtp(email, otp);

  // Step 2: Check the database again before creating the user.
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new AppError(httpStatus.CONFLICT, 'This email already exists');
  }

  // Step 3: Create the verified user in PostgreSQL.
  const user = await prisma.user.create({
    data: {
      name: pendingUser.name,
      email: pendingUser.email,
      password: pendingUser.passwordHash,
      authProvider: AuthProvider.CREDENTIAL,
      emailVerified: true,
    },
  });

  // Step 4: Delete the temporary registration data from Redis.
  await otpService.deletePendingUser(email);

  const tokens = createAuthTokens(user);

  return {
    user: getPublicUser(user),
    tokens,
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

  if (tokenPayload.type !== 'refresh' || typeof tokenPayload.id !== 'string') {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is invalid');
  }

  const foundUser = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
  });

  const user = checkUserCanLogin(foundUser);
  const tokens = createAuthTokens(user);

  return {
    user: getPublicUser(user),
    tokens,
  };
};

const createGoogleLoginCode = (user: Pick<User, 'id'>): string => {
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

  const foundUser = await prisma.user.findUnique({
    where: { id: tokenPayload.id },
  });

  const user = checkUserCanLogin(foundUser);
  const tokens = createAuthTokens(user);

  return {
    user: getPublicUser(user),
    tokens,
  };
};

export const authService = {
  checkUserCanLogin,
  createAuthTokens,
  createGoogleLoginCode,
  exchangeGoogleLoginCode,
  getPublicUser,
  refreshAuthTokens,
  registerUser,
  resendVerificationOtp,
  verifyEmailAndCreateUser,
};
