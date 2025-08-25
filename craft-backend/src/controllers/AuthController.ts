import { Request, Response } from 'express';
import { AuthService } from '@/services/AuthService';
import { AuthRequest } from '@/middleware/auth';
import { ValidationError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new ValidationError('Email and password are required');
    }

    const result = await this.authService.login({ email, password });

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result.data,
    });
  });

  register = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { email, password, name, role, department, managerId } = req.body;

    if (!email || !password || !name) {
      throw new ValidationError('Email, password, and name are required');
    }

    const result = await this.authService.register({
      email,
      password,
      name,
      role,
      department,
      managerId,
    });

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.data,
    });
  });

  refreshToken = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new ValidationError('Refresh token is required');
    }

    const result = await this.authService.refreshToken(refreshToken);

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      ...result.data,
    });
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current password and new password are required');
    }

    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    const result = await this.authService.changePassword(
      req.user._id!,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.data?.message,
    });
  });

  validateToken = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ValidationError('Token is required');
    }

    const token = authHeader.substring(7);
    const result = await this.authService.validateToken(token);

    if (!result.success) {
      res.status(result.statusCode || 500).json({
        success: false,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      user: result.data,
    });
  });

  getProfile = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    if (!req.user) {
      throw new ValidationError('User not authenticated');
    }

    res.status(200).json({
      success: true,
      data: req.user,
    });
  });

  logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<any> => {
    // In a real application, you might want to blacklist the token
    // For now, we'll just return a success message
    logger.info(`User logged out: ${req.user?.email}`);
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}