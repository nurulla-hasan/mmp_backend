import { randomUUID } from 'node:crypto';
import { Router } from 'express';
import httpStatus from 'http-status';
import { isGoogleAuthConfigured, passport } from '../../config/passport.js';
import { env } from '../../config/index.js';
import { auth } from '../../middlewares/auth.js';
import { validate } from '../../middlewares/validate.js';
import { AppError } from '../../utils/app-error.js';
import { jwtUtils } from '../../utils/jwt.js';
import { authController } from './auth.controller.js';
import {
  exchangeSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resendOtpSchema,
  verifyEmailSchema,
} from './auth.validation.js';

export const authRouter = Router();

authRouter.post('/register', validate(registerSchema), authController.register);
authRouter.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);
authRouter.post('/resend-otp', validate(resendOtpSchema), authController.resendOtp);
authRouter.post('/login', validate(loginSchema), authController.authenticateLocal, authController.login);
authRouter.post('/refresh-token', validate(refreshSchema), authController.refresh);
authRouter.post('/google/exchange', validate(exchangeSchema), authController.exchangeGoogleCode);
authRouter.post('/logout', authController.logout);
authRouter.get('/me', auth(), authController.me);
authRouter.get('/google', (req, res, next) => {
  if (!isGoogleAuthConfigured) {
    return next(new AppError(httpStatus.SERVICE_UNAVAILABLE, 'Google authentication is not configured'));
  }
  const state = jwtUtils.createToken(
    { nonce: randomUUID(), type: 'oauth-state' },
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
});
authRouter.get(
  '/google/callback',
  (req, res, next) => {
    const state = typeof req.query.state === 'string' ? req.query.state : '';
    const cookieState = req.cookies?.oauthState;
    res.clearCookie('oauthState', { path: `${env.API_PREFIX}/auth/google/callback` });
    if (!state || !cookieState || state !== cookieState) {
      return next(new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in state is invalid'));
    }
    try {
      const payload = jwtUtils.verifyToken(state, env.JWT_ACCESS_SECRET);
      if (payload.type !== 'oauth-state') throw new Error('Invalid state type');
      return next();
    } catch {
      return next(new AppError(httpStatus.UNAUTHORIZED, 'Google sign-in state is invalid or expired'));
    }
  },
  passport.authenticate('google', {
    failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
    session: false,
  }),
  authController.googleCallback,
);
