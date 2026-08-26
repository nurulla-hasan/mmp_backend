import { randomUUID } from 'node:crypto';
import type { RequestHandler } from 'express';
import httpStatus from 'http-status';
import { env } from '../../config/index.js';
import { isGoogleAuthConfigured, passport } from '../../config/passport.js';
import { AppError } from '../../utils/app-error.js';
import { catchAsync } from '../../utils/catch-async.js';
import { jwtUtils } from '../../utils/jwt.js';
import { sendResponse } from '../../utils/send-response.js';
import { authService } from './auth.service.js';

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
        return next(
          new AppError(httpStatus.UNAUTHORIZED, info?.message ?? 'Login failed'),
        );
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

  const tokens = authService.createAuthTokens(req.user);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Login successful',
    data: {
      user: req.user,
      ...tokens,
    },
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
  const result = await authService.verifyEmailAndCreateUser(
    req.body.email,
    req.body.otp,
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Email verification successful',
    data: {
      user: result.user,
      ...result.tokens,
    },
  });
});

const resendVerificationOtp = catchAsync(async (req, res) => {
  await authService.resendVerificationOtp(req.body.email);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'A new OTP has been sent',
    data: null,
  });
});

const refreshAuthTokens = catchAsync(async (req, res) => {
  const refreshToken = req.cookies?.refreshToken ?? req.body.refreshToken;

  if (!refreshToken) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Refresh token is required');
  }

  const result = await authService.refreshAuthTokens(refreshToken);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Tokens refreshed successfully',
    data: {
      user: result.user,
      ...result.tokens,
    },
  });
});

const startGoogleLogin: RequestHandler = (req, res, next) => {
  if (!isGoogleAuthConfigured) {
    return next(
      new AppError(
        httpStatus.SERVICE_UNAVAILABLE,
        'Google authentication is not configured',
      ),
    );
  }

  const state = jwtUtils.createToken(
    {
      nonce: randomUUID(),
      type: 'oauth-state',
    },
    env.JWT_ACCESS_SECRET,
    '10m',
  );

  res.cookie('oauthState', state, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 10 * 60 * 1000,
    path: `${env.API_PREFIX}/auth/google/callback`,
  });

  return passport.authenticate('google', {
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
    return next(
      new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in state is invalid'),
    );
  }

  try {
    const tokenPayload = jwtUtils.verifyToken(
      stateFromGoogle,
      env.JWT_ACCESS_SECRET,
    );

    if (tokenPayload.type !== 'oauth-state') {
      throw new Error('Invalid Google state type');
    }

    next();
  } catch {
    next(
      new AppError(
        httpStatus.UNAUTHORIZED,
        'Google sign-in state is invalid or expired',
      ),
    );
  }
};

const googleLoginCallback: RequestHandler = (req, res) => {
  if (!req.user) {
    throw new AppError(httpStatus.UNAUTHORIZED, 'Google login failed');
  }

  const googleLoginCode = authService.createGoogleLoginCode(req.user);
  const frontendCallbackUrl = new URL('/api/auth/google/callback', env.FRONTEND_URL);

  frontendCallbackUrl.searchParams.set('code', googleLoginCode);
  res.redirect(frontendCallbackUrl.toString());
};

const exchangeGoogleLoginCode = catchAsync(async (req, res) => {
  const result = await authService.exchangeGoogleLoginCode(req.body.code);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Google login successful',
    data: {
      user: result.user,
      ...result.tokens,
    },
  });
});

const getMe: RequestHandler = (req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Current user retrieved',
    data: {
      user: req.user,
    },
  });
};

const logoutUser: RequestHandler = (_req, res) => {
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Logout successful',
    data: null,
  });
};

export const authController = {
  exchangeGoogleLoginCode,
  getMe,
  googleLoginCallback,
  loginUser,
  loginUserWithPassport,
  logoutUser,
  refreshAuthTokens,
  registerUser,
  resendVerificationOtp,
  startGoogleLogin,
  verifyEmail,
  verifyGoogleLoginState,
};
