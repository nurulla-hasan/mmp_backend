import type { Response } from 'express';

interface ResponseOptions<T> {
  statusCode?: number;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
}

export const sendResponse = <T>(res: Response, options: ResponseOptions<T>): void => {
  res.status(options.statusCode ?? 200).json({
    success: true,
    message: options.message,
    ...(options.data !== undefined && { data: options.data }),
    ...(options.meta !== undefined && { meta: options.meta }),
  });
};
