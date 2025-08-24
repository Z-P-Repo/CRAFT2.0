import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { Request, Response, NextFunction } from 'express';
import { config } from '@/config/environment';
import { RateLimitError } from '@/exceptions/AppError';

// Rate limiting configuration
export const createRateLimit = (options?: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options?.windowMs || config.rateLimit.windowMs,
    max: options?.max || config.rateLimit.maxRequests,
    message: {
      success: false,
      error: options?.message || 'Too many requests from this IP, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
    },
    skipSuccessfulRequests: options?.skipSuccessfulRequests || false,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      throw new RateLimitError(
        options?.message || 'Too many requests from this IP, please try again later'
      );
    },
  });
};

// Different rate limits for different endpoints
export const authRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.isDevelopment ? 100 : 5, // Higher limit for development
  message: 'Too many authentication attempts, please try again later',
});

export const apiRateLimit = createRateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.isDevelopment ? 1000 : config.rateLimit.maxRequests,
});

export const strictRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // Very strict for sensitive operations
  message: 'Too many requests for this operation, please try again later',
});

// Helmet configuration for security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Adjust based on your needs
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove X-Powered-By header
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Request-ID', req.headers['x-request-id'] || 'unknown');
  
  next();
};