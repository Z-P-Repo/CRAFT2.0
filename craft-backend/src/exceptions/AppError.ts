import { ErrorCodes, IAppError } from '@/types';

export class AppError extends Error implements IAppError {
  public readonly code: ErrorCodes;
  public readonly statusCode: number;
  public readonly details?: any;
  public readonly isOperational: boolean = true;

  constructor(
    code: ErrorCodes,
    message: string,
    statusCode: number,
    details?: any
  ) {
    super(message);
    
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  public toJSON() {
    return {
      success: false,
      error: this.message,
      code: this.code,
      details: this.details,
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.VALIDATION_ERROR, message, 400, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(ErrorCodes.AUTHENTICATION_ERROR, message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(ErrorCodes.AUTHORIZATION_ERROR, message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(ErrorCodes.NOT_FOUND, `${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.CONFLICT, message, 409, details);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(ErrorCodes.INTERNAL_SERVER_ERROR, message, 500, details);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(ErrorCodes.BAD_REQUEST, message, 400, details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(ErrorCodes.RATE_LIMIT_EXCEEDED, message, 429);
  }
}