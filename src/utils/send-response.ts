import type { Response } from 'express';

interface TMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface TResponseData<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: TMeta;
}

export const sendResponse = <T>(res: Response, data: TResponseData<T>): void => {
  res.status(data.statusCode).json({
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
    data: data.data,
    meta: data.meta,
  });
};
