import { randomInt } from 'node:crypto';
import httpStatus from 'http-status';
import { env } from '../../config/index.js';
import { deleteCache, getCache, getCacheTtl, setCache } from '../../lib/redis.js';
import { AppError } from '../../utils/app-error.js';

type OtpData = {
  otp: string;
  attempts: number;
};

const getOtpKey = (email: string): string => `otp:${email}`;

const generateOtp = async (email: string): Promise<string> => {
  const otp = randomInt(100000, 1000000).toString();
  await setCache<OtpData>(
    getOtpKey(email),
    { otp, attempts: env.OTP_MAX_ATTEMPTS },
    env.OTP_EXPIRES_IN_SECONDS,
  );
  return otp;
};

const validateOtp = async (email: string, otp: string): Promise<void> => {
  const key = getOtpKey(email);
  const data = await getCache<OtpData>(key);
  if (!data) throw new AppError(httpStatus.BAD_REQUEST, 'OTP has expired', 'OTP_EXPIRED');
  if (data.attempts <= 0) {
    throw new AppError(httpStatus.TOO_MANY_REQUESTS, 'OTP attempts exceeded', 'OTP_ATTEMPTS_EXCEEDED');
  }

  if (data.otp !== otp) {
    const ttl = await getCacheTtl(key);
    await setCache(key, { ...data, attempts: data.attempts - 1 }, Math.max(ttl, 1));
    throw new AppError(httpStatus.BAD_REQUEST, 'Invalid OTP', 'INVALID_OTP');
  }

};

const deleteOtp = async (email: string): Promise<void> => {
  await deleteCache(getOtpKey(email));
};

export const otpService = { deleteOtp, generateOtp, validateOtp };
