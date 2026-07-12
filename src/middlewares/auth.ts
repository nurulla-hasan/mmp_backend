import type { Request, RequestHandler } from 'express';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { AppError } from '../errors/app-error.js';
import { prisma } from '../lib/prisma.js';
import { USER_ROLES, type AuthUser, type UserRole } from '../types/auth.js';
import { asyncHandler } from '../utils/async-handler.js';
import { verifyAccessToken } from '../utils/jwt.js';

const validRoles = new Set<UserRole>(Object.values(USER_ROLES));

const getAccessToken = (req: Request): string | undefined => {
  const cookies: unknown = req.cookies;
  const cookieToken =
    typeof cookies === 'object' && cookies !== null
      ? (cookies as Record<string, unknown>)['accessToken']
      : undefined;
  if (typeof cookieToken === 'string' && cookieToken.length > 0) return cookieToken;

  const authorization = req.headers.authorization?.trim();
  if (!authorization) return undefined;

  const [scheme, bearerToken, ...extraParts] = authorization.split(/\s+/);
  if (scheme === 'Bearer') {
    return bearerToken && extraParts.length === 0 ? bearerToken : undefined;
  }

  return authorization.includes(' ') ? undefined : authorization;
};

export const auth = (...allowedRoles: UserRole[]): RequestHandler =>
  asyncHandler(async (req, _res, next) => {
    const token = getAccessToken(req);

    if (!token) {
      return next(new AppError(401, 'A valid access token is required', 'UNAUTHORIZED'));
    }

    let decoded: AuthUser;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        return next(new AppError(401, 'Access token has expired', 'TOKEN_EXPIRED'));
      }
      if (error instanceof JsonWebTokenError) {
        return next(new AppError(401, 'Access token is invalid', 'INVALID_TOKEN'));
      }
      return next(error);
    }

    if (!validRoles.has(decoded.role)) {
      return next(new AppError(401, 'Access token contains an invalid role', 'UNAUTHORIZED'));
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true, activeStatus: true },
    });

    if (!user) {
      return next(new AppError(401, 'User not found', 'UNAUTHORIZED'));
    }

    if (user.activeStatus === 'BLOCKED') {
      return next(new AppError(403, 'Your account has been blocked!', 'FORBIDDEN'));
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role as UserRole)) {
      return next(new AppError(403, 'You do not have permission to access this resource', 'FORBIDDEN'));
    }

    req.user = { userId: user.id, role: user.role as UserRole };
    return next();
  });
