import { ConfidentialClientApplication, Configuration, AuthenticationResult } from '@azure/msal-node';
import { config } from '@/config/environment';
import { UserRepository } from '@/repositories/UserRepository';
import { AuthService } from './AuthService';
import { IUser } from '@/types';
import { logger } from '@/utils/logger';
import { AuthenticationError } from '@/exceptions/AppError';
import axios from 'axios';

interface AzureAdUserInfo {
  id: string;
  displayName: string;
  mail: string;
  userPrincipalName: string;
  givenName?: string;
  surname?: string;
  department?: string;
  jobTitle?: string;
}

export class AzureAdService {
  private msalClient: ConfidentialClientApplication | null = null;
  private userRepository: UserRepository;
  private authService: AuthService;

  constructor() {
    this.userRepository = new UserRepository();
    this.authService = new AuthService();
    this.initializeMsal();
  }

  private initializeMsal(): void {
    if (!config.azureAd.enabled) {
      logger.warn('Azure AD SSO is not enabled - missing required configuration');
      return;
    }

    const clientConfig: Configuration = {
      auth: {
        clientId: config.azureAd.clientId!,
        clientSecret: config.azureAd.clientSecret!,
        authority: config.azureAd.authority!,
      },
      system: {
        loggerOptions: {
          loggerCallback: (level, message, containsPii) => {
            if (containsPii) {
              return;
            }
            switch (level) {
              case 1: // Error
                logger.error(`MSAL Error: ${message}`);
                break;
              case 2: // Warning
                logger.warn(`MSAL Warning: ${message}`);
                break;
              case 3: // Info
                logger.info(`MSAL Info: ${message}`);
                break;
              case 4: // Verbose
                logger.debug(`MSAL Debug: ${message}`);
                break;
            }
          },
          piiLoggingEnabled: false,
          logLevel: config.isDevelopment ? 4 : 2,
        },
      },
    };

    this.msalClient = new ConfidentialClientApplication(clientConfig);
    logger.info('Azure AD MSAL client initialized successfully');
  }

  public isEnabled(): boolean {
    return config.azureAd.enabled && this.msalClient !== null;
  }

  public async getAuthUrl(): Promise<string> {
    if (!this.msalClient) {
      throw new AuthenticationError('Azure AD is not configured');
    }

    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: config.azureAd.redirectUri!,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  public async handleCallback(authCode: string, state?: string): Promise<{
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken: string | undefined;
  }> {
    if (!this.msalClient) {
      throw new AuthenticationError('Azure AD is not configured');
    }

    try {
      const tokenRequest = {
        code: authCode,
        scopes: ['openid', 'profile', 'email', 'User.Read'],
        redirectUri: config.azureAd.redirectUri!,
      };

      const response: AuthenticationResult = await this.msalClient.acquireTokenByCode(tokenRequest);

      if (!response || !response.account) {
        throw new AuthenticationError('Failed to authenticate with Azure AD');
      }

      // Get additional user information from Microsoft Graph
      const userInfo = await this.getUserInfoFromGraph(response.accessToken!);

      // Find or create user in local database
      const user = await this.findOrCreateUser(userInfo, response.account);

      // Generate local JWT token
      const tokenResult = await this.authService.generateTokens(user._id!);

      logger.info(`Azure AD SSO successful for user: ${user.email}`);

      return {
        user: { ...user },
        accessToken: tokenResult.accessToken,
        refreshToken: tokenResult.refreshToken,
      };
    } catch (error: any) {
      logger.error('Azure AD authentication error:', error);
      throw new AuthenticationError(
        error.message || 'Failed to authenticate with Azure AD'
      );
    }
  }

  private async getUserInfoFromGraph(accessToken: string): Promise<AzureAdUserInfo> {
    try {
      const response = await axios.get('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    } catch (error: any) {
      logger.error('Failed to get user info from Microsoft Graph:', error);
      throw new AuthenticationError('Failed to retrieve user information from Azure AD');
    }
  }

  private async findOrCreateUser(
    azureUserInfo: AzureAdUserInfo,
    msalAccount: any
  ): Promise<IUser> {
    const email = azureUserInfo.mail || azureUserInfo.userPrincipalName;

    if (!email) {
      throw new AuthenticationError('No email found in Azure AD user profile');
    }

    // Try to find existing user
    let user = await this.userRepository.findByEmail(email);

    if (user) {
      // Update user info from Azure AD if needed
      const updateData: Partial<IUser> = {};
      
      if (azureUserInfo.displayName && user.name !== azureUserInfo.displayName) {
        updateData.name = azureUserInfo.displayName;
      }
      
      if (azureUserInfo.department && user.department !== azureUserInfo.department) {
        updateData.department = azureUserInfo.department;
      }

      // Update last login
      updateData.lastLoginAt = new Date();

      if (Object.keys(updateData).length > 0) {
        user = await this.userRepository.update(user._id!, updateData);
      }

      return user!;
    }

    // Create new user
    const newUserData: Partial<IUser> = {
      email,
      name: azureUserInfo.displayName || azureUserInfo.givenName || email,
      role: 'basic', // Default role for new Azure AD users
      ...(azureUserInfo.department && { department: azureUserInfo.department }),
      active: true,
      lastLoginAt: new Date(),
      // No password needed for SSO users
      password: '', // Will be ignored in creation
      azureAdId: azureUserInfo.id,
      authProvider: 'azuread',
    };

    const createdUser = await this.userRepository.create(newUserData as Omit<IUser, '_id'>);
    
    logger.info(`Created new user from Azure AD: ${email}`);
    
    return createdUser;
  }

  public async refreshAccessToken(refreshToken: string): Promise<string | null> {
    if (!this.msalClient) {
      return null;
    }

    try {
      // MSAL handles token refresh internally
      // For this implementation, we'll rely on our local JWT refresh mechanism
      return null;
    } catch (error) {
      logger.error('Failed to refresh Azure AD access token:', error);
      return null;
    }
  }

  public async revokeTokens(userId: string): Promise<boolean> {
    try {
      // In a production environment, you might want to revoke tokens from Azure AD
      // For now, we'll just handle local token cleanup
      logger.info(`Revoking Azure AD tokens for user: ${userId}`);
      return true;
    } catch (error) {
      logger.error('Failed to revoke Azure AD tokens:', error);
      return false;
    }
  }
}