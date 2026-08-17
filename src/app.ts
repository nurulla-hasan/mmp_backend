import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/index";
import { globalErrorHandler } from "./middlewares/global-error-handler";
import { notFound } from "./middlewares/not-found";
import { healthRouter } from "./modules/health/health.routes";
import { apiRouter } from "./routes/index";

export const createApp = () => {
  const app = express();

  app.disable("x-powered-by");
  app.set("trust proxy", env.TRUST_PROXY);
  app.use(helmet());
  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        if (!origin || env.CORS_ORIGINS.includes(origin))
          return callback(null, true);
        return callback(null, false);
      },
    }),
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      limit: env.RATE_LIMIT_MAX,
      standardHeaders: "draft-8",
      legacyHeaders: false,
    }),
  );

  app.get("/", (_req, res) =>
    res.json({ success: true, message: `Welcome to ${env.APP_NAME}` }),
  );

  app.use("/health", healthRouter);
  app.use(env.API_PREFIX, apiRouter);

  app.use(notFound);
  app.use(globalErrorHandler);
  return app;
};

export const app = createApp();
