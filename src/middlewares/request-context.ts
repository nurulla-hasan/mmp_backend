import { randomUUID } from 'node:crypto';
import pinoHttp from 'pino-http';
import { logger } from '../lib/logger.js';

export const requestContext = pinoHttp({
  logger,
  genReqId(req, res) {
    const requestId = req.headers['x-request-id']?.toString() ?? randomUUID();
    res.setHeader('x-request-id', requestId);
    return requestId;
  },
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
});
