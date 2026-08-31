import 'dotenv/config';
import { z } from 'zod';

const booleanString = z
  .enum(['true', 'false'])
  .default('false')
  .transform((value) => value === 'true');

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().max(65_535).default(5000),
    HOST: z.string().default('0.0.0.0'),
    API_PREFIX: z.string().startsWith('/').default('/api/v1'),
    APP_NAME: z.string().min(1).default('MMP API'),
    DATABASE_URL: z
      .url()
      .default('postgresql://postgres:postgres@localhost:5432/mmp?schema=public'),
    CORS_ORIGINS: z.string().default('http://localhost:3000'),
    FRONTEND_URL: z.url().default('http://localhost:3000'),
    TRUST_PROXY: booleanString,
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
    JWT_ACCESS_SECRET: z.string().min(32).default('development-only-secret-change-me'),
    JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
    JWT_REFRESH_SECRET: z.string().min(32).default('development-only-refresh-secret-change-me'),
    JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_CALLBACK_URL: z.url().default('http://localhost:5000/api/v1/auth/google/callback'),
    REDIS_URL: z.string().min(1).default('redis://localhost:6379'),
    OTP_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(300),
    OTP_MAX_ATTEMPTS: z.coerce.number().int().positive().default(3),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    MAIL_FROM: z.string().default('Mouza Map Pro <no-reply@example.com>'),
    ADMIN_EMAIL: z.string().default('admin@mouzamappro.com'),
    ADMIN_NAME: z.string().default('Super Admin'),
    ADMIN_PASSWORD: z.string().default('11111111'),
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
  })
  .superRefine((value, context) => {
    if (value.NODE_ENV === 'production') {
      if (value.JWT_ACCESS_SECRET === 'development-only-secret-change-me') {
        context.addIssue({
          code: 'custom',
          path: ['JWT_ACCESS_SECRET'],
          message: 'A unique JWT secret is required in production',
        });
      }
      if (value.JWT_REFRESH_SECRET === 'development-only-refresh-secret-change-me') {
        context.addIssue({
          code: 'custom',
          path: ['JWT_REFRESH_SECRET'],
          message: 'A unique JWT refresh secret is required in production',
        });
      }
      if (!value.GOOGLE_CLIENT_ID || !value.GOOGLE_CLIENT_SECRET) {
        context.addIssue({
          code: 'custom',
          path: ['GOOGLE_CLIENT_ID'],
          message: 'Google OAuth credentials are required in production',
        });
      }
      if (!value.SMTP_HOST || !value.SMTP_USER || !value.SMTP_PASS) {
        context.addIssue({
          code: 'custom',
          path: ['SMTP_HOST'],
          message: 'SMTP credentials are required in production',
        });
      }
    }
  });

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid environment configuration: ${issues}`);
}

export const env = Object.freeze({
  ...parsed.data,
  CORS_ORIGINS: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
});
