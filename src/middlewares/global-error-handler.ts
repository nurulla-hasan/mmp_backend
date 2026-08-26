import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/index.js';
import { AppError } from '../utils/app-error.js';

export const globalErrorHandler: ErrorRequestHandler = (error: unknown, _req, res, next) => {
  void next;
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected error occurred';
  let details: unknown;

  if (error instanceof AppError) {
    ({ statusCode, code, message, details } = error);
  } else if (error instanceof ZodError) {
    statusCode = 422;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }));
  } else if (error instanceof SyntaxError && 'body' in error) {
    statusCode = 400;
    code = 'INVALID_JSON';
    message = 'Request body contains invalid JSON';
  } else if (typeof error === 'object' && error !== null && 'code' in error) {
    const prismaCode = String((error as { code: unknown }).code);
    if (prismaCode === 'P2002') {
      statusCode = 409;
      code = 'DUPLICATE_ENTRY';
      const field = (error as { meta?: { target?: string[] } }).meta?.target?.[0] ?? 'field';
      message = `Duplicate value for '${field}'. This ${field} already exists.`;
    } else if (prismaCode === 'P2025') {
      statusCode = 404;
      code = 'NOT_FOUND';
      message = (error as { meta?: { cause?: string } }).meta?.cause ?? 'Record not found.';
    } else if (prismaCode === 'P2003') {
      statusCode = 400;
      code = 'FOREIGN_KEY_CONSTRAINT';
      message = 'Invalid reference: the related record does not exist.';
    } else if (prismaCode === 'P2006') {
      statusCode = 400;
      code = 'INVALID_DATA_TYPE';
      message = 'Invalid data type provided.';
    }
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    error: {
      code,
      message,
      ...(details !== undefined && { details }),
      ...(env.NODE_ENV === 'development' && error instanceof Error && { stack: error.stack }),
    },
  });
};
