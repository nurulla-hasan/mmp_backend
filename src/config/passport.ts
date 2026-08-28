import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { AuthProvider } from '../../generated/prisma/enums.js';
import { prisma } from '../lib/prisma.js';
import { env } from './index.js';

passport.use(
  new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
      session: false,
    },
    async (rawEmail, password, done) => {
      try {
        const email = rawEmail.trim().toLowerCase();

        // Step 1: Find the user by email.
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.password) {
          return done(null, false, {
            message: 'Invalid email or password.',
          });
        }

        // Step 2: Match the submitted password with the hashed password.
        const isPasswordMatched = await bcrypt.compare(password, user.password);

        if (!isPasswordMatched) {
          return done(null, false, {
            message: 'Invalid email or password.',
          });
        }

        // Step 3: Make sure the account is active and verified.
        if (user.status !== 'ACTIVE') {
          return done(null, false, {
            message: 'Your account is unavailable.',
          });
        }

        if (!user.emailVerified) {
          return done(null, false, {
            message: 'Please verify your email.',
          });
        }

        return done(null, user);
      } catch (error) {
        return done(error);
      }
    },
  ),
);

export const isGoogleAuthConfigured = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);

if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile: Profile, done) => {
        try {
          const googleEmail = profile.emails?.[0]?.value;

          if (!googleEmail) {
            return done(null, false, {
              message: 'Google account has no email address.',
            });
          }

          const email = googleEmail.trim().toLowerCase();
          const googleImage = profile.photos?.[0]?.value || '';

          // Step 1: Check whether this Google account is already connected.
          let user = await prisma.user.findFirst({
            where: { googleId: profile.id },
          });

          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: {
                emailVerified: true,
                imageUrl: user.imageUrl || googleImage,
              },
            });
          } else {
            // Step 2: Check whether a credential account exists with this email.
            const userWithSameEmail = await prisma.user.findUnique({
              where: { email },
            });

            if (userWithSameEmail) {
              // Link Google login with the existing credential account.
              user = await prisma.user.update({
                where: { id: userWithSameEmail.id },
                data: {
                  googleId: userWithSameEmail.googleId ?? profile.id,
                  emailVerified: true,
                  imageUrl: userWithSameEmail.imageUrl || googleImage,
                },
              });
            } else {
              // Step 3: Create a new user when no account exists.
              user = await prisma.user.create({
                data: {
                  name: profile.displayName || email.split('@')[0] || 'MMP User',
                  email,
                  googleId: profile.id,
                  authProvider: AuthProvider.GOOGLE,
                  emailVerified: true,
                  imageUrl: googleImage,
                },
              });
            }
          }

          if (user.status !== 'ACTIVE') {
            return done(null, false, {
              message: 'Your account is unavailable.',
            });
          }

          return done(null, user);
        } catch (error) {
          return done(error);
        }
      },
    ),
  );
}

export { passport };
