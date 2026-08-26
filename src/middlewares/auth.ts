import type { Request, RequestHandler } from 'express';
import httpStatus from 'http-status';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { Role } from '../../generated/prisma/enums';
import { env } from '../config/index.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import { catchAsync } from '../utils/catch-async.js';
import { jwtUtils } from '../utils/jwt.js';

const validRoles = new Set<Role>(Object.values(Role));
const getAccessToken = (req: Request): string | undefined => {
  const authorization = req.headers.authorization;
  return req.cookies?.accessToken ??
    (authorization?.startsWith('Bearer ') ? authorization.slice(7) : authorization);
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

    if (decoded.type !== 'access' || typeof decoded.id !== 'string' || !validRoles.has(decoded.role as Role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Access token is invalid');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, imageUrl: true },
    });
    if (!user) throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
    if (!user.emailVerified) throw new AppError(httpStatus.UNAUTHORIZED, 'Your email is not verified!');
    if (user.status !== 'ACTIVE') throw new AppError(httpStatus.FORBIDDEN, 'Your account is unavailable');
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      throw new AppError(httpStatus.FORBIDDEN, 'You do not have permission to access this resource');
    }
    req.user = user;
    next();
  });
