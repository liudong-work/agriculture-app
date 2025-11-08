import type { NextFunction, Request, Response } from 'express';

type AppError = {
  status?: number;
  message: string;
  details?: unknown;
};

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.status ?? 500;
  const payload = {
    success: false,
    message: err.message || '服务器开小差了，请稍后再试',
    details: err.details,
  };

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  res.status(statusCode).json(payload);
}

