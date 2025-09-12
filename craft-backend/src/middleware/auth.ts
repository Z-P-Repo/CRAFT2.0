import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import { config } from '@/config/environment';
import { AuthenticationError, AuthorizationError } from '@/exceptions/AppError';
import { IJWTPayload, IUser } from '@/types';
import { AuthenticatedRequest, OptionalAuthRequest } from '@/types/express';
import { UserRepository } from '@/repositories/UserRepository';
import { asyncHandler } from './errorHandler';

// Keep the old interface for backward compatibility
export interface AuthRequest extends Request {
  user?: Omit<IUser, 'password'>;
}

const userRepository = new UserRepository();

export const requireAuth = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    // TEMPORARY: Development bypass for testing
    if (config.isDevelopment && req.query.bypass === 'dev') {
      // Create a mock user for development with proper ObjectId
      // Using the actual admin user ID from database to match workspace ownership
      req.user = {
        _id: new Types.ObjectId('68c3d5afaf7c6f1e88aa8a53'),
        globalUserId: 'test-user-global',
        email: 'test@example.com',
        name: 'Test User',
        role: 'super_admin',
        isActive: true,
        currentWorkspace: 'seed-workspace'
      } as any;
      return next();
    }
    
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new AuthenticationError('Access denied. No token provided.');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      
      const user = await userRepository.findById(decoded.userId);
      
      if (!user) {
        throw new AuthenticationError('Token is valid but user not found');
      }

      if (!user.active) {
        throw new AuthenticationError('User account is inactive');
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = user;
      req.user = userWithoutPassword;
      
      next();
    } catch (jwtError) {
      if (jwtError instanceof jwt.JsonWebTokenError) {
        throw new AuthenticationError('Invalid token');
      }
      throw jwtError;
    }
  }
);

export const optionalAuth = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      const user = await userRepository.findById(decoded.userId);
      
      if (user && user.active) {
        const { password, ...userWithoutPassword } = user;
        req.user = userWithoutPassword;
      }
    } catch (jwtError) {
      // Silent fail for optional auth
    }
    
    next();
  }
);

export const requireRole = (roles: string | string[]) => {
  const allowedRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AuthorizationError(
        `Access denied. Required roles: ${allowedRoles.join(', ')}`
      );
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');

export const requireAdminOrSuperAdmin = requireRole(['admin', 'super_admin']);

export const requireManagerOrAbove = requireRole(['manager', 'senior_manager', 'admin']);

export const requireSelfOrAdmin = (userIdParam: string = 'id') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      throw new AuthenticationError('Authentication required');
    }

    const targetUserId = req.params[userIdParam];
    const isAdmin = req.user.role === 'admin';
    const isSelf = req.user._id === targetUserId;

    if (!isAdmin && !isSelf) {
      throw new AuthorizationError('Access denied. Can only access own resources or admin required');
    }

    next();
  };
};

// Default auth export for convenience
export const auth = requireAuth;