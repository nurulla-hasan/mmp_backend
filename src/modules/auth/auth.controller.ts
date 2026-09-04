import { randomUUID } from 'node:crypto';
import type { Request, RequestHandler, Response } from 'express';
import httpStatus from 'http-status';
import type { User } from '../../../generated/prisma/client';

import { env } from '../../config/index';
import { isGoogleAuthConfigured, passport } from '../../config/passport';

import { AppError } from '../../utils/app-error';
import { catchAsync } from '../../utils/catch-async';
import { sendResponse } from '../../utils/send-response';

import { authService } from './auth.service';

const GOOGLE_AUTH_COOKIE_PATH = `${env.API_PREFIX}/auth/google`;
const MOBILE_CODE_CHALLENGE_REGEX = /^[a-f0-9]{64}$/;

type GoogleOAuthClient = 'web' | 'mobile';

const getGoogleOAuthClient = (req: Request): GoogleOAuthClient =>
  req.cookies?.oauthClient === 'mobile' ? 'mobile' : 'web';

const clearGoogleOAuthCookies = (res: Response) => {
  const cookieOptions = { path: GOOGLE_AUTH_COOKIE_PATH };
  res.clearCookie('oauthState', cookieOptions);
  res.clearCookie('oauthClient', cookieOptions);
  res.clearCookie('oauthCodeChallenge', cookieOptions);
};

const getMobileRedirectUrl = (params: Record<string, string>) => {
  const redirectUrl = new URL(env.MOBILE_APP_REDIRECT_URL);
  for (const [key, value] of Object.entries(params)) {
    redirectUrl.searchParams.set(key, value);
  }
  return redirectUrl.toString();
};

const redirectGoogleFailure = (req: Request, res: Response) => {
  const client = getGoogleOAuthClient(req);
  clearGoogleOAuthCookies(res);

  if (client === 'mobile') {
    res.redirect(getMobileRedirectUrl({ error: 'google_auth_failed' }));
    return;
  }

  res.redirect(`${env.FRONTEND_URL}/login?error=google_auth_failed`);
};

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

  const client: GoogleOAuthClient = req.query.client === 'mobile' ? 'mobile' : 'web';
  const codeChallenge =
    typeof req.query.codeChallenge === 'string' ? req.query.codeChallenge.toLowerCase() : '';

  if (client === 'mobile' && !MOBILE_CODE_CHALLENGE_REGEX.test(codeChallenge)) {
    return next(new AppError(httpStatus.BAD_REQUEST, 'Mobile Google sign-in challenge is invalid'));
  }

  const state = randomUUID();
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 10 * 60 * 1000,
    path: GOOGLE_AUTH_COOKIE_PATH,
  };

  res.cookie('oauthState', state, cookieOptions);
  res.cookie('oauthClient', client, cookieOptions);

  if (client === 'mobile') {
    res.cookie('oauthCodeChallenge', codeChallenge, cookieOptions);
  }

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
    path: GOOGLE_AUTH_COOKIE_PATH,
  });

  if (!stateFromGoogle || !stateFromCookie || stateFromGoogle !== stateFromCookie) {
    redirectGoogleFailure(req, res);
    return;
  }

  next();
};

const authenticateGoogleCallback: RequestHandler = (req, res, next) => {
  passport.authenticate(
    'google',
    { session: false },
    (
      error: unknown,
      user: Express.User | false | null | undefined,
    ) => {
      if (error || !user) {
        redirectGoogleFailure(req, res);
        return;
      }

      req.user = user;
      next();
    },
  )(req, res, next);
};

const googleLoginFailure: RequestHandler = (req, res) => {
  redirectGoogleFailure(req, res);
};

const googleLoginCallback = catchAsync(async (req, res) => {
  if (!req.user) {
    redirectGoogleFailure(req, res);
    return;
  }

  const user = req.user as unknown as User;
  const client = getGoogleOAuthClient(req);

  if (client === 'mobile') {
    const codeChallenge = req.cookies?.oauthCodeChallenge;

    if (
      typeof codeChallenge !== 'string' ||
      !MOBILE_CODE_CHALLENGE_REGEX.test(codeChallenge)
    ) {
      redirectGoogleFailure(req, res);
      return;
    }

    const code = await authService.createMobileGoogleAuthCode(user, codeChallenge);
    clearGoogleOAuthCookies(res);
    res.redirect(getMobileRedirectUrl({ code }));
    return;
  }

  const result = authService.loginUser(user);
  clearGoogleOAuthCookies(res);

  const redirectUrl = new URL('/auth/success', env.FRONTEND_URL);
  redirectUrl.searchParams.set('accessToken', result.accessToken);
  redirectUrl.searchParams.set('refreshToken', result.refreshToken);

  res.redirect(redirectUrl.toString());
});

const exchangeMobileGoogleAuthCode = catchAsync(async (req, res) => {
  const result = await authService.exchangeMobileGoogleAuthCode(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google login successful',
    data: result,
  });
});

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
  authenticateGoogleCallback,
  googleLoginFailure,
  googleLoginCallback,
  exchangeMobileGoogleAuthCode,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  resendResetOtp,
  resetPassword,
  logoutUser,
};
