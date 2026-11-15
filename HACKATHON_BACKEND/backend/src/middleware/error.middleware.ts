import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;
  const code = isAppError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = isAppError ? err.message : 'An unexpected server error occurred';

  // Log error with request context
  logger.error(
    {
      err: {
        message: err.message,
        stack: err.stack,
        code,
      },
      method: req.method,
      url: req.originalUrl,
      userId: req.user?.id,
      companyId: req.companyId,
    },
    'Request Error Handler triggered'
  );

  const details = isAppError ? err.details : undefined;

  return sendError(res, message, statusCode, code, details);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND');
};
