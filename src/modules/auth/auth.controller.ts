import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import type { User } from '../../../generated/prisma/client';

import { env } from '../../config/index';
import { isGoogleAuthConfigured, passport } from '../../config/passport';

import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';

import { authService } from './auth.service';
import { clearAuthCookies, setAuthCookies } from './auth.utils';

const loginUserWithPassport: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'local',
    { session: false },
    (
      error: unknown,
      user: Express.User | false | null | undefined,
      info?: { message?: string },
    ) => {
      if (error) {
        return next(error);
      }

      if (!user) {
        return next(new AppError(httpStatus.UNAUTHORIZED, info?.message || 'Login failed'));
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

const loginUser = catchAsync(async (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Login failed');
  }

  const result = authService.loginUser(req.user as unknown as User);
  setAuthCookies(res, result);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: result,
  });
});

const registerUser = catchAsync(async (req, res) => {
  const result = await authService.registerUser(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: 'Verification code sent. Complete verification to create your account.',
    data: result,
  });
});

const verifyEmail = catchAsync(async (req, res) => {
  const { email, otp } = req.body;
  const result = await authService.verifyEmailAndCreateUser(email, otp);
  setAuthCookies(res, result);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Email verification successful',
    data: result,
  });
});

const resendVerificationOtp = catchAsync(async (req, res) => {
  const { email } = req.body;
  await authService.resendVerificationOtp(email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'A new OTP has been sent',
    data: null,
  });
});

const refreshAuthTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const result = await authService.refreshAuthTokens(refreshToken);
  setAuthCookies(res, result);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tokens refreshed successfully',
    data: result,
  });
});

const startGoogleLogin: RequestHandler = (req, res, next) => {
  if (!isGoogleAuthConfigured) {
    return next(
      new AppError(httpStatus.SERVICE_UNAVAILABLE, 'Google authentication is not configured'),
    );
  }

  const state = randomUUID();

  res.cookie('oauthState', state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: `${env.API_PREFIX}/auth/google/callback`,
  });

  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
    state,
  })(req, res, next);
};

const verifyGoogleLoginState: RequestHandler = (req, res, next) => {
  const stateFromGoogle = typeof req.query.state === 'string' ? req.query.state : '';
  const stateFromCookie = req.cookies?.oauthState;

  res.clearCookie('oauthState', {
    path: `${env.API_PREFIX}/auth/google/callback`,
  });

  if (!stateFromGoogle || !stateFromCookie || stateFromGoogle !== stateFromCookie) {
    return next(new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in state is invalid'));
  }

  next();
};

const googleLoginCallback: RequestHandler = (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google login failed');
  }

  const result = authService.loginUser(req.user as unknown as User);

  setAuthCookies(res, result);

  res.redirect(new URL('/auth/success', env.FRONTEND_URL).toString());
};


const getMe: RequestHandler = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user?.id as string);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Current user retrieved',
    data: {
      user,
    },
  });
});

const logoutUser: RequestHandler = (_req, res) => {
  clearAuthCookies(res);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Logout successful',
    data: null,
  });
};

const updateMe = catchAsync(async (req, res) => {
  const result = await authService.updateMe(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successfully',
    data: { user: result },
  });
});

const changePassword = catchAsync(async (req, res) => {
  const result = await authService.changePassword(req.user!.id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const result = await authService.forgotPassword(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const resendResetOtp = catchAsync(async (req, res) => {
  const result = await authService.resendPasswordResetOtp(req.body.email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const result = await authService.resetPassword(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: result.message,
    data: null,
  });
});

export const authController = {
  loginUser,
  loginUserWithPassport,
  registerUser,
  verifyEmail,
  resendVerificationOtp,
  refreshAuthTokens,
  startGoogleLogin,
  verifyGoogleLoginState,
  googleLoginCallback,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resendResetOtp,
  resetPassword,
  logoutUser,
};
