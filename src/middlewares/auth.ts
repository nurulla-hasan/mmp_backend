import type { Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import type { Role } from '../../generated/prisma/enums';
import { env } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { catchAsync } from '../utils/catch-async.js';
import { jwtUtils } from '../utils/jwt.js';

const getAccessToken = (req: Request): string | undefined => {
  const token =
    req.cookies?.accessToken ??
    (req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : req.headers.authorization);

  return token ? token : undefined;
};

export const optionalAuth: RequestHandler = async (req, _res, next) => {
  const token = getAccessToken(req);

  // This middleware is for public routes that can return a better response when
  // a valid signed-in viewer is known. No token means normal guest access.
  if (!token) {
    next();
    return;
  }

  let decoded: JwtPayload;
  try {
    decoded = jwtUtils.verifyToken(token, env.JWT_ACCESS_SECRET);
  } catch {
    // A public endpoint must remain public even when a stale/invalid token is
    // present. Protected routes continue to use the strict auth() middleware.
    next();
    return;
  }

  if (!decoded.id) {
    next();
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isSubscribed: true,
        emailVerified: true,
      },
    });

    if (!user || !user.emailVerified || user.status !== 'ACTIVE') {
      next();
      return;
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isSubscribed: user.isSubscribed,
    };

    next();
  } catch (error) {
    // Database/infrastructure failures are real server failures and should not
    // be hidden as a guest response.
    next(error);
  }
};

export const auth = (...allowedRoles: Role[]): RequestHandler =>
  catchAsync(async (req, _res, next) => {
    const token = getAccessToken(req);
    if (!token) throw new AppError(httpStatus.UNAUTHORIZED, 'You are not logged in!');

    let decoded: JwtPayload;
    try {
      decoded = jwtUtils.verifyToken(token, env.JWT_ACCESS_SECRET);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Access token has expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AppError(httpStatus.UNAUTHORIZED, 'Access token is invalid');
      }
      throw error;
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        isSubscribed: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return next(new AppError(httpStatus.UNAUTHORIZED, 'User not found'));
    }
    if (!user.emailVerified)
      throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified!');
    if (user.status !== 'ACTIVE')
      throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');

    // ROLE CHECK
    if (allowedRoles.length > 0) {
      const hasPermission =
        user.role === 'SUPER_ADMIN' ||
        allowedRoles.includes(user.role);

      if (!hasPermission) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          'You do not have permission to access this resource',
        );
      }
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isSubscribed: user.isSubscribed,
    };
    next();
  });
