import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '@/config/environment';
import { UserRepository } from '@/repositories/UserRepository';
import { IUser, ILoginRequest, ILoginResponse, IServiceResult, IJWTPayload } from '@/types';
import { AuthenticationError, ValidationError, ConflictError } from '@/exceptions/AppError';
import { logger } from '@/utils/logger';

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async login(loginData: ILoginRequest): Promise<IServiceResult<ILoginResponse>> {
    try {
      const { email, password } = loginData;

      // Find user with password
      const user = await this.userRepository.findByEmail(email, true);
      
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      if (!user.active) {
        throw new AuthenticationError('Account is inactive');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        throw new AuthenticationError('Invalid email or password');
      }

      // Generate tokens
      const token = this.generateToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      logger.info(`User logged in: ${user.email}`);

      return {
        success: true,
        data: {
          success: true,
          message: 'Login successful',
          token,
          refreshToken,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
        statusCode: error instanceof AuthenticationError ? 401 : 500,
      };
    }
  }

  async register(userData: Partial<IUser>): Promise<IServiceResult<IUser>> {
    try {
      const { email, password, name, role = 'basic' } = userData;

      if (!email || !password || !name) {
        throw new ValidationError('Email, password, and name are required');
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(email);
      
      if (existingUser) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.hashPassword(password);

      // Create user
      const newUser = await this.userRepository.create({
        ...userData,
        email,
        password: hashedPassword,
        name,
        role,
      });

      logger.info(`New user registered: ${email}`);

      return {
        success: true,
        data: newUser,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Registration failed',
        statusCode: error instanceof ValidationError ? 400 : 
                   error instanceof ConflictError ? 409 : 500,
      };
    }
  }

  async refreshToken(refreshToken: string): Promise<IServiceResult<{ token: string; refreshToken: string }>> {
    try {
      if (!config.jwt.refreshSecret) {
        throw new AuthenticationError('Refresh token functionality not configured');
      }

      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as IJWTPayload;
      
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user || !user.active) {
        throw new AuthenticationError('User not found or inactive');
      }

      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        success: true,
        data: {
          token: newToken,
          refreshToken: newRefreshToken,
        },
      };
    } catch (error) {
      logger.error('Token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token refresh failed',
        statusCode: 401,
      };
    }
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<IServiceResult<{ message: string }>> {
    try {
      const user = await this.userRepository.findByEmail('', true); // Need to get by ID with password
      
      if (!user) {
        throw new AuthenticationError('User not found');
      }

      // Verify current password
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      
      if (!isValidPassword) {
        throw new AuthenticationError('Current password is incorrect');
      }

      // Hash new password
      const hashedNewPassword = await this.hashPassword(newPassword);

      // Update password
      await this.userRepository.updatePassword(userId, hashedNewPassword);

      logger.info(`Password changed for user: ${user.email}`);

      return {
        success: true,
        data: { message: 'Password updated successfully' },
      };
    } catch (error) {
      logger.error('Change password error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Password change failed',
        statusCode: error instanceof AuthenticationError ? 401 : 500,
      };
    }
  }

  async validateToken(token: string): Promise<IServiceResult<Omit<IUser, 'password'>>> {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as IJWTPayload;
      
      const user = await this.userRepository.findById(decoded.userId);
      
      if (!user || !user.active) {
        throw new AuthenticationError('Invalid token or user not found');
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid token',
        statusCode: 401,
      };
    }
  }

  private generateToken(user: IUser): string {
    const payload: IJWTPayload = {
      userId: user._id!,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  private generateRefreshToken(user: IUser): string {
    if (!config.jwt.refreshSecret) {
      return '';
    }

    const payload: IJWTPayload = {
      userId: user._id!,
      email: user.email,
      role: user.role,
    };

    return jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
    });
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  public generateTokens(userId: string): { accessToken: string; refreshToken: string | undefined } {
    const user = { _id: userId } as IUser; // Minimal user object for token generation
    
    const refreshToken = this.generateRefreshToken(user);
    
    return {
      accessToken: this.generateToken(user),
      refreshToken: refreshToken || undefined,
    };
  }
}