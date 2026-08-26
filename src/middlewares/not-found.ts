import type { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import { AppError } from '../utils/app-error';

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(httpStatus.NOT_FOUND, `Route not found: ${req.originalUrl}`));
};
