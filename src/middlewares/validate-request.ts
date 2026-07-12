import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';

type RequestPart = 'body' | 'params' | 'query';

export const validateRequest = (schema: ZodType, part: RequestPart = 'body'): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[part]);
    if (!result.success) return next(result.error);
    if (part === 'body') req.body = result.data;
    if (part !== 'body') Object.assign(req[part], result.data);
    next();
  };
