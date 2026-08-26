import { randomInt } from 'node:crypto';
import httpStatus from 'http-status';
import { env } from '../../config/index.js';
import { deleteCache, getCache, getCacheTtl, setCache } from '../../lib/redis.js';
import { AppError } from '../../utils/app-error.js';

export type PendingRegistration = {
  name: string;
  email: string;
  passwordHash: string;
};

type RegistrationData = PendingRegistration & {
  otp: string;
  attempts: number;
};

const getRegistrationKey = (email: string): string => `registration:${email}`;

const generateOtp = (): string => randomInt(100000, 1000000).toString();

const createRegistration = async (user: PendingRegistration): Promise<string> => {
  const otp = generateOtp();
  await setCache<RegistrationData>(
    getRegistrationKey(user.email),
    { ...user, otp, attempts: env.OTP_MAX_ATTEMPTS },
    env.OTP_EXPIRES_IN_SECONDS,
  );
  return otp;
};

const validateOtp = async (email: string, otp: string): Promise<PendingRegistration> => {
  const key = getRegistrationKey(email);
  const data = await getCache<RegistrationData>(key);
  if (!data) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Registration has expired. Please register again.', 'OTP_EXPIRED');
  }
  if (data.attempts <= 0) {
    throw new AppError(httpStatus.TOO_MANY_REQUESTS, 'OTP attempts exceeded', 'OTP_ATTEMPTS_EXCEEDED');
  }

  if (data.otp !== otp) {
    const ttl = await getCacheTtl(key);
    await setCache(key, { ...data, attempts: data.attempts - 1 }, Math.max(ttl, 1));
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP', 'INVALID_OTP');
  }

  return { name: data.name, email: data.email, passwordHash: data.passwordHash };
};

const resendOtp = async (email: string): Promise<string> => {
  const data = await getCache<RegistrationData>(getRegistrationKey(email));
  if (!data) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Registration has expired. Please register again.', 'OTP_EXPIRED');
  }

  const otp = generateOtp();
  await setCache<RegistrationData>(
    getRegistrationKey(email),
    { ...data, otp, attempts: env.OTP_MAX_ATTEMPTS },
    env.OTP_EXPIRES_IN_SECONDS,
  );
  return otp;
};

const deleteRegistration = async (email: string): Promise<void> => {
  await deleteCache(getRegistrationKey(email));
};

export const otpService = { createRegistration, deleteRegistration, resendOtp, validateOtp };
