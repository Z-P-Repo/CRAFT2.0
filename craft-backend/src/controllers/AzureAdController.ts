import { Request, Response } from 'express';
import { AzureAdService } from '@/services/AzureAdService';
import { ValidationError, AuthenticationError } from '@/exceptions/AppError';
import { asyncHandler } from '@/middleware/errorHandler';
import { logger } from '@/utils/logger';

export class AzureAdController {
  private azureAdService: AzureAdService;

  constructor() {
    this.azureAdService = new AzureAdService();
  }

  getAuthUrl = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    if (!this.azureAdService.isEnabled()) {
      throw new ValidationError('Azure AD SSO is not configured');
    }

    try {
      const authUrl = await this.azureAdService.getAuthUrl();
      
      res.status(200).json({
        success: true,
        message: 'Azure AD auth URL generated',
        data: {
          authUrl,
          enabled: true
        }
      });
    } catch (error: any) {
      logger.error('Failed to generate Azure AD auth URL:', error);
      throw new AuthenticationError(error.message || 'Failed to generate authentication URL');
    }
  });

  handleCallback = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { code, state, error, error_description } = req.query;

    // Handle OAuth error responses
    if (error) {
      logger.error('Azure AD OAuth error:', { error, error_description });
      throw new AuthenticationError(
        `Azure AD authentication failed: ${error_description || error}`
      );
    }

    if (!code || typeof code !== 'string') {
      throw new ValidationError('Authorization code is required');
    }

    if (!this.azureAdService.isEnabled()) {
      throw new ValidationError('Azure AD SSO is not configured');
    }

    try {
      const result = await this.azureAdService.handleCallback(
        code, 
        state as string
      );

      // Set secure HTTP-only cookies for tokens
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.status(200).json({
        success: true,
        message: 'Azure AD authentication successful',
        data: {
          user: result.user,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
          authProvider: 'azuread'
        }
      });
    } catch (error: any) {
      logger.error('Azure AD callback error:', error);
      throw new AuthenticationError(
        error.message || 'Azure AD authentication failed'
      );
    }
  });

  getConfig = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const isEnabled = this.azureAdService.isEnabled();
    
    res.status(200).json({
      success: true,
      data: {
        enabled: isEnabled,
        provider: 'azuread'
      }
    });
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    // Clear authentication cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  });
}