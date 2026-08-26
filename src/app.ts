import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import passport from 'passport';
import { env } from './config/index.js';
import './config/passport.js';
import { globalErrorHandler } from './middlewares/global-error-handler.js';
import { notFound } from './middlewares/not-found.js';
import { healthRouter } from './modules/health/health.routes.js';
import { apiRouter } from './routes/index.js';

export const createApp = () => {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        callback(null, !origin || env.CORS_ORIGINS.includes(origin));
      },
    }),
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(passport.initialize());
  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: 'draft-8',
      legacyHeaders: false,
    }),
  );
  app.get('/', (_req, res) => res.json({ success: true, message: `Welcome to ${env.APP_NAME}` }));
  app.use('/health', healthRouter);
  app.use(env.API_PREFIX, apiRouter);
  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
};

export const app = createApp();
