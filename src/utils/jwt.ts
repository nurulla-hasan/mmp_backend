import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { AuthUser } from '../types/auth.js';

interface AccessTokenPayload {
  role: AuthUser['role'];
}

const tokenOptions = {
  algorithm: 'HS256',
  issuer: env.JWT_ISSUER,
  audience: env.JWT_AUDIENCE,
} as const;

export const signAccessToken = (user: AuthUser): string =>
  jwt.sign(
    { role: user.role } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      ...tokenOptions,
      subject: user.userId,
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
    },
  );

export const verifyAccessToken = (token: string): AuthUser => {
  const payload = jwt.verify(token, env.JWT_ACCESS_SECRET, tokenOptions);

  if (typeof payload === 'string' || !payload.sub || typeof payload.role !== 'string') {
    throw new jwt.JsonWebTokenError('Invalid access token payload');
  }

  return { userId: payload.sub, role: payload.role as AuthUser['role'] };
};
