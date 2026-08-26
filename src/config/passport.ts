import bcrypt from 'bcryptjs';
import passport from 'passport';
import { Strategy as GoogleStrategy, type Profile } from 'passport-google-oauth20';
import { Strategy as LocalStrategy } from 'passport-local';
import { prisma } from '../lib/prisma.js';
import { env } from './index.js';

passport.use(
  new LocalStrategy(
    { usernameField: 'email', passwordField: 'password', session: false },
    async (rawEmail, password, done) => {
      try {
        const email = rawEmail.trim().toLowerCase();
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password || !(await bcrypt.compare(password, user.password))) {
          return done(null, false, { message: 'ইমেইল অথবা পাসওয়ার্ড সঠিক নয়।' });
        }
        if (user.status !== 'ACTIVE') {
          return done(null, false, { message: 'আপনার অ্যাকাউন্টটি ব্যবহারযোগ্য নয়।' });
        }
        if (!user.emailVerified) {
          return done(null, false, { message: 'আপনার ইমেইল ভেরিফাই করুন।' });
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
          const email = profile.emails?.[0]?.value;
          if (!email) return done(null, false, { message: 'Google account has no email address.' });

          const normalizedEmail = email.trim().toLowerCase();
          const existing = await prisma.user.findFirst({
            where: { OR: [{ googleId: profile.id }, { email: normalizedEmail }] },
          });
          const user = existing
            ? await prisma.user.update({
                where: { id: existing.id },
                data: {
                  googleId: existing.googleId ?? profile.id,
                  emailVerified: true,
                  imageUrl: existing.imageUrl || profile.photos?.[0]?.value || '',
                },
              })
            : await prisma.user.create({
                data: {
                  name: profile.displayName || normalizedEmail.split('@')[0] || 'MMP User',
                  email: normalizedEmail,
                  googleId: profile.id,
                  authProvider: 'GOOGLE',
                  emailVerified: true,
                  imageUrl: profile.photos?.[0]?.value || '',
                },
              });

          if (user.status !== 'ACTIVE') {
            return done(null, false, { message: 'Your account is unavailable.' });
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
