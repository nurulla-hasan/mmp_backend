import 'express-serve-static-core';
import type { Logger } from 'pino';
import type { AuthUser } from './auth.js';

declare module 'express-serve-static-core' {
  interface Request {
    id: string;
    log: Logger;
    user?: AuthUser;
  }
}
