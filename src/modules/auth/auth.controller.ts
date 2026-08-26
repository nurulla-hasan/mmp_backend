import type { NextFunction, Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import { env } from '../../config/index.js';
import { passport } from '../../config/passport.js';
import { AppError } from '../../utils/app-error.js';
import { catchAsync } from '../../utils/catch-async.js';
import { sendResponse } from '../../utils/send-response.js';
import { authService } from './auth.service.js';

const authenticateLocal: RequestHandler = (req, res, next) => {
  passport.authenticate('local', { session: false }, (error: unknown, user: Express.User | false, info?: { message?: string }) => {
    if (error) return next(error);
    if (!user) return next(new AppError(httpStatus.UNAUTHORIZED, info?.message ?? 'Login failed'));
    req.user = user;
    next();
  })(req, res, next);
};

const login = catchAsync(async (req, res) => {
  if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, 'Login failed');
  const tokens = authService.createTokenPair(req.user);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: { user: req.user, ...tokens },
  });
});

const register = catchAsync(async (req, res) => {
  const result = await authService.register(req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Account created successfully',
    data: { user: result.user, ...result.tokens },
  });
});

const refresh = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;
  if (!refreshToken) throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  const result = await authService.refresh(refreshToken);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tokens refreshed successfully',
    data: { user: result.user, ...result.tokens },
  });
});

const exchangeGoogleCode = catchAsync(async (req, res) => {
  const result = await authService.exchangeGoogleCode(req.body.code);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google login successful',
    data: { user: result.user, ...result.tokens },
  });
});

const googleCallback = (req: Request, res: Response) => {
  if (!req.user) throw new AppError(httpStatus.UNAUTHORIZED, 'Google login failed');
  const code = authService.createGoogleExchangeCode(req.user);
  const callbackUrl = new URL('/api/auth/google/callback', env.FRONTEND_URL);
  callbackUrl.searchParams.set('code', code);
  res.redirect(callbackUrl.toString());
};

const me: RequestHandler = (req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Current user retrieved',
    data: { user: req.user },
  });
};

const logout: RequestHandler = (_req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Logout successful',
    data: null,
  });
};

export const authController = {
  authenticateLocal,
  exchangeGoogleCode,
  googleCallback,
  login,
  logout,
  me,
  refresh,
  register,
};
