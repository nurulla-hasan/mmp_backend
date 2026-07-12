import type { RequestHandler } from 'express';
import { env } from '../../config/env.js';
import { sendResponse } from '../../utils/send-response.js';

const startedAt = Date.now();

export const liveness: RequestHandler = (_req, res) => {
  sendResponse(res, {
    message: 'Service is healthy',
    data: { service: env.APP_NAME, uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000) },
  });
};

export const readiness: RequestHandler = (_req, res) => {
  // Add database/cache dependency checks here once the schema and infrastructure are finalized.
  sendResponse(res, { message: 'Service is ready', data: { service: env.APP_NAME } });
};
