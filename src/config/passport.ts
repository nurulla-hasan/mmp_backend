import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import bcrypt from 'bcryptjs';
import passport from 'passport';

import { env } from './index.js';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../utils/app-error.js';
import httpStatus from 'http-status';
import { AuthProvider } from '../../generated/prisma/enums.js';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    async (email, password, done) => {
      try {
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) {
          return done(new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password'), false, {
            message: 'Invalid email or password',
          });
        }

        if (user.status !== 'ACTIVE') {
          return done(new AppError(httpStatus.FORBIDDEN, 'Your account is disabled'), false, {
            message: 'Your account is disabled',
          });
        }

        if (!user.password) {
          return done(
            new AppError(
              httpStatus.UNAUTHORIZED,
              'Please login with your Google account',
            ),
            false,
            { message: 'Please login with your Google account' },
          );
        }

        if (!user.emailVerified) {
          return done(new AppError(httpStatus.UNAUTHORIZED, 'Please verify your email address'), false, {
            message: 'Please verify your email address',
          });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);

        if (!isPasswordMatch) {
          return done(new AppError(httpStatus.UNAUTHORIZED, 'Invalid email or password'), false, {
            message: 'Invalid email or password',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

export const isGoogleAuthConfigured = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

if (isGoogleAuthConfigured) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID as string,
        clientSecret: env.GOOGLE_CLIENT_SECRET as string,
        callbackURL: env.GOOGLE_CALLBACK_URL as string,
        passReqToCallback: true,
      },
      async (req, accessToken, refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value;

          if (!email) {
            return done(new AppError(httpStatus.BAD_REQUEST, 'Email address is required from Google'));
          }

          const googleImage = profile.photos?.[0]?.value || '';

          // Step 1: Check whether this Google account is already connected.
          let user = await prisma.user.findFirst({
            where: {
              OR: [{ googleId: profile.id }, { email: email }],
            },
          });

          if (user) {
            if (user.status !== 'ACTIVE') {
              return done(new AppError(httpStatus.FORBIDDEN, 'Your account is disabled'));
            }

            const updateData: any = {};
            let shouldUpdate = false;

            if (!user.googleId) {
              updateData.googleId = profile.id;
              shouldUpdate = true;
            }

            if (!user.imageUrl && googleImage) {
              updateData.imageUrl = googleImage;
              shouldUpdate = true;
            }

            if (!user.emailVerified) {
              updateData.emailVerified = true;
              shouldUpdate = true;
            }

            if (shouldUpdate) {
              user = await prisma.user.update({
                where: { id: user.id },
                data: updateData,
              });
            }

            return done(null, user);
          }

          // Step 2: Create a new account if no matching user is found.
          user = await prisma.user.create({
            data: {
              name: profile.displayName || email.split('@')[0] || 'MMP User',
              email: email,
              googleId: profile.id,
              authProvider: AuthProvider.GOOGLE,
              emailVerified: true,
              imageUrl: googleImage,
            },
          });

          return done(null, user);
        } catch (error) {
          return done(error as Error);
        }
      },
    ),
  );
}

export { passport };
