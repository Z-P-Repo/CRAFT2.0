import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { AuthenticationError, AuthorizationError } from '@/exceptions/AppError';
import { IJWTPayload, IUser } from '@/types';
import { UserRepository } from '@/repositories/UserRepository';
import { asyncHandler } from './errorHandler';

export interface AuthRequest extends Request {
  user?: Omit<IUser, 'password'>;
}

const userRepository = new UserRepository();

export const requireAuth = asyncHandler(
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<any> => {
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