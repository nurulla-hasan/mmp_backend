import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../utils/app-error.js';
import { catchAsync } from '../utils/catch-async.js';

export const validate = (schema: ZodType) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        }));
        throw new AppError(
          httpStatus.UNPROCESSABLE_ENTITY,
          'Request validation failed',
          'VALIDATION_ERROR',
          details,
        );
      }
      throw error;
    }
  });
