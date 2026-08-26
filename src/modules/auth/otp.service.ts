import { randomInt } from 'node:crypto';
import httpStatus from 'http-status';
import { env } from '../../config/index.js';
import { deleteCache, getCache, getCacheTtl, setCache } from '../../lib/redis.js';
import { AppError } from '../../utils/app-error.js';

export interface IPendingUser {
  name: string;
  email: string;
  passwordHash: string;
}

interface IRegistrationData extends IPendingUser {
  otp: string;
  attempts: number;
}

const getRegistrationKey = (email: string): string => {
  return `registration:${email}`;
};

const generateOtp = (): string => {
  return randomInt(100000, 1000000).toString();
};

const savePendingUser = async (userData: IPendingUser): Promise<string> => {
  const otp = generateOtp();

  const registrationData: IRegistrationData = {
    ...userData,
    otp,
    attempts: env.OTP_MAX_ATTEMPTS,
  };

  await setCache(
    getRegistrationKey(userData.email),
    registrationData,
    env.OTP_EXPIRES_IN_SECONDS,
  );

  return otp;
};

const verifyRegistrationOtp = async (
  email: string,
  submittedOtp: string,
): Promise<IPendingUser> => {
  const key = getRegistrationKey(email);
  const registrationData = await getCache<IRegistrationData>(key);

  if (!registrationData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Registration has expired. Please register again.',
      'OTP_EXPIRED',
    );
  }

  if (registrationData.attempts <= 0) {
    throw new AppError(
      httpStatus.TOO_MANY_REQUESTS,
      'OTP attempts exceeded',
      'OTP_ATTEMPTS_EXCEEDED',
    );
  }

  if (registrationData.otp !== submittedOtp) {
    const remainingTime = await getCacheTtl(key);
    const updatedData = {
      ...registrationData,
      attempts: registrationData.attempts - 1,
    };

    // Keep the old expiry time when an incorrect OTP is submitted.
    await setCache(key, updatedData, Math.max(remainingTime, 1));

    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP', 'INVALID_OTP');
  }

  return {
    name: registrationData.name,
    email: registrationData.email,
    passwordHash: registrationData.passwordHash,
  };
};

const resendRegistrationOtp = async (email: string): Promise<string> => {
  const key = getRegistrationKey(email);
  const registrationData = await getCache<IRegistrationData>(key);

  if (!registrationData) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Registration has expired. Please register again.',
      'OTP_EXPIRED',
    );
  }

  const newOtp = generateOtp();
  const updatedData: IRegistrationData = {
    ...registrationData,
    otp: newOtp,
    attempts: env.OTP_MAX_ATTEMPTS,
  };

  await setCache(key, updatedData, env.OTP_EXPIRES_IN_SECONDS);

  return newOtp;
};

const deletePendingUser = async (email: string): Promise<void> => {
  await deleteCache(getRegistrationKey(email));
};

export const otpService = {
  deletePendingUser,
  resendRegistrationOtp,
  savePendingUser,
  verifyRegistrationOtp,
};
