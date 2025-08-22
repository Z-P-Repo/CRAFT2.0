import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/exceptions/AppError';
import { logger } from '@/utils/logger';
import { config } from '@/config/environment';
import { ErrorCodes } from '@/types';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let appError: AppError;

  // Convert known errors to AppError
  if (error instanceof AppError) {
    appError = error;
  } else if (error.name === 'ValidationError') {
    appError = new AppError(
      ErrorCodes.VALIDATION_ERROR,
      'Validation failed',
      400,
      error.message
    );
  } else if (error.name === 'CastError') {
    appError = new AppError(
      ErrorCodes.BAD_REQUEST,
      'Invalid ID format',
      400
    );
  } else if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const field = Object.keys((error as any).keyValue)[0];
    appError = new AppError(
      ErrorCodes.CONFLICT,
      `${field} already exists`,
      409
    );
  } else if (error.name === 'JsonWebTokenError') {
    appError = new AppError(
      ErrorCodes.AUTHENTICATION_ERROR,
      'Invalid token',
      401
    );
  } else if (error.name === 'TokenExpiredError') {
    appError = new AppError(
      ErrorCodes.AUTHENTICATION_ERROR,
      'Token expired',
      401
    );
  } else {
    // Unknown error
    appError = new AppError(
      ErrorCodes.INTERNAL_SERVER_ERROR,
      config.isDevelopment ? error.message : 'Something went wrong',
      500,
      config.isDevelopment ? error.stack : undefined
    );
  }

  // Log error
  if (appError.statusCode >= 500) {
    logger.error({
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      stack: error.stack,
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      user: (req as any).user?.id,
    });
  } else {
    logger.warn({
      message: appError.message,
      code: appError.code,
      statusCode: appError.statusCode,
      url: req.url,
      method: req.method,
      ip: req.ip,
    });
  }

  // Send error response
  res.status(appError.statusCode).json(appError.toJSON());
};

export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new AppError(
    ErrorCodes.NOT_FOUND,
    `Route ${req.originalUrl} not found`,
    404
  );
  next(error);
};

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};