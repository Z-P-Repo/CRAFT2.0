# Authentication Module Documentation

The CRAFT backend authentication system provides secure multi-provider authentication supporting both local JWT-based authentication and Azure AD Single Sign-On (SSO) with refresh tokens, password hashing, and comprehensive security features for the ABAC permission system.

## Overview

The authentication module handles user authentication through multiple providers:
- **Local Authentication**: Traditional email/password with JWT tokens
- **Azure AD SSO**: Microsoft authentication with OAuth 2.0/OpenID Connect
- **Automatic User Provisioning**: Creates users from Azure AD with default roles
- **Token Management**: Secure JWT token generation and refresh mechanisms
- **Session Security**: Industry-standard security practices

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Auth Routes    │───▶│ AuthController  │───▶│  AuthService    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Auth Middleware│    │  JWT Utilities  │    │ UserRepository  │
└─────────────────┘    └─────────────────┘    └─────────────────┘

                        ┌─────────────────┐
                        │ Azure AD Routes │
                        └─────────┬───────┘
                                  │
                                  ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │AzureAdController│───▶│ AzureAdService  │
                        └─────────────────┘    └─────────────────┘
                                  │                       │
                                  ▼                       ▼
                        ┌─────────────────┐    ┌─────────────────┐
                        │ Microsoft Graph │    │ MSAL Libraries  │
                        └─────────────────┘    └─────────────────┘
```

## Core Components

### AuthController

**Location**: `/src/controllers/AuthController.ts`

Handles HTTP requests for authentication endpoints.

#### Endpoints

```typescript
class AuthController {
  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
}
```

### AuthService

**Location**: `/src/services/AuthService.ts`

Contains business logic for authentication operations.

```typescript
class AuthService {
  private userRepository: UserRepository;

  async login(credentials: LoginCredentials): Promise<ServiceResponse<LoginResponse>> {
    try {
      // Find user with password
      const user = await this.userRepository.findByEmail(credentials.email, true);
      
      if (!user) {
        throw new AuthenticationError('Invalid email or password');
      }

      if (!user.active) {
        throw new AuthenticationError('Account is inactive');
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, user.password);
      
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
          token,
          refreshToken,
          user: userWithoutPassword,
        },
      };
    } catch (error) {
      logger.error('Login error:', error);
      return {
        success: false,
        error: error.message,
        statusCode: error instanceof AuthenticationError ? 401 : 500,
      };
    }
  }
}
```

## JWT Token Management

### Token Generation

```typescript
private generateToken(user: IUser): string {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
  };

  return jwt.sign(
    payload,
    config.security.jwtSecret,
    {
      expiresIn: config.security.jwtExpiresIn,
      issuer: 'craft-system',
      audience: 'craft-frontend',
    }
  );
}

private generateRefreshToken(user: IUser): string {
  const payload = {
    userId: user._id,
    email: user.email,
    role: user.role,
    type: 'refresh',
  };

  return jwt.sign(
    payload,
    config.security.jwtRefreshSecret,
    {
      expiresIn: config.security.jwtRefreshExpiresIn,
      issuer: 'craft-system',
      audience: 'craft-frontend',
    }
  );
}
```

### Token Validation

```typescript
async validateToken(token: string): Promise<ServiceResponse<IUser>> {
  try {
    const decoded = jwt.verify(token, config.security.jwtSecret) as JwtPayload;
    
    if (!decoded.userId) {
      throw new AuthenticationError('Invalid token structure');
    }

    const user = await this.userRepository.findById(decoded.userId);
    
    if (!user || !user.active) {
      throw new AuthenticationError('User not found or inactive');
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
```

### AzureAdController

**Location**: `/src/controllers/AzureAdController.ts`

Handles Azure AD OAuth 2.0/OpenID Connect authentication flow.

#### Endpoints

```typescript
class AzureAdController {
  // GET /api/v1/azure-ad/auth-url
  getAuthUrl = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const authUrl = await this.azureAdService.getAuthUrl();
    
    res.status(200).json({
      success: true,
      message: 'Azure AD auth URL generated',
      data: { authUrl, enabled: true }
    });
  });

  // GET /api/v1/azure-ad/callback
  handleCallback = asyncHandler(async (req: Request, res: Response): Promise<any> => {
    const { code, state, error, error_description } = req.query;

    if (error) {
      throw new AuthenticationError(`Azure AD authentication failed: ${error_description || error}`);
    }

    const result = await this.azureAdService.handleCallback(code as string, state as string);

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
  });
}
```

### AzureAdService

**Location**: `/src/services/AzureAdService.ts`

Handles Azure AD integration using Microsoft Authentication Library (MSAL).

#### Key Methods

```typescript
class AzureAdService {
  public async getAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: config.azureAd.redirectUri!,
    };

    return await this.msalClient.getAuthCodeUrl(authCodeUrlParameters);
  }

  public async handleCallback(authCode: string, state?: string): Promise<{
    user: Omit<IUser, 'password'>;
    accessToken: string;
    refreshToken?: string;
  }> {
    const tokenRequest = {
      code: authCode,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      redirectUri: config.azureAd.redirectUri!,
    };

    const response = await this.msalClient.acquireTokenByCode(tokenRequest);
    const userInfo = await this.getUserInfoFromGraph(response.accessToken!);
    const user = await this.findOrCreateUser(userInfo, response.account);
    const tokenResult = await this.authService.generateTokens(user._id!);

    return {
      user: { ...user },
      accessToken: tokenResult.accessToken,
      refreshToken: tokenResult.refreshToken,
    };
  }
}
```

### Refresh Token Logic

```typescript
async refreshToken(refreshToken: string): Promise<ServiceResponse<{
  token: string;
  refreshToken?: string;
}>> {
  try {
    const decoded = jwt.verify(
      refreshToken, 
      config.security.jwtRefreshSecret
    ) as JwtPayload;
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid refresh token type');
    }

    const user = await this.userRepository.findById(decoded.userId);
    
    if (!user || !user.active) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new tokens
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
    return {
      success: false,
      error: 'Invalid refresh token',
      statusCode: 401,
    };
  }
}
```

## Password Security

### Password Hashing

```typescript
import bcrypt from 'bcryptjs';

// Hash password during registration
const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = config.security.bcryptRounds;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password during login
const verifyPassword = async (
  plainPassword: string, 
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};
```

### Password Validation

```typescript
const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
```

## Authentication Middleware

**Location**: `/src/middleware/auth.ts`

Protects routes and validates JWT tokens.

```typescript
export interface AuthRequest extends Request {
  user?: IUser;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Access token required');
    }

    const token = authHeader.substring(7);
    
    const decoded = jwt.verify(token, config.security.jwtSecret) as JwtPayload;
    
    const user = await userRepository.findById(decoded.userId);
    
    if (!user || !user.active) {
      throw new AuthenticationError('User not found or inactive');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
        code: 'INVALID_TOKEN',
      });
    } else if (error instanceof AuthenticationError) {
      res.status(401).json({
        success: false,
        error: error.message,
        code: 'AUTHENTICATION_ERROR',
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
};
```

## User Registration

### Registration Service

```typescript
async register(userData: RegisterUserData): Promise<ServiceResponse<IUser>> {
  try {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    
    if (existingUser) {
      throw new ValidationError('User with this email already exists');
    }

    // Validate password
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      throw new ValidationError(passwordValidation.errors.join(', '));
    }

    // Hash password
    const hashedPassword = await hashPassword(userData.password);

    // Create user data
    const userToCreate = {
      ...userData,
      password: hashedPassword,
      active: true,
      createdAt: new Date(),
    };

    const user = await this.userRepository.create(userToCreate);
    
    // Remove password from response
    const { password: _, ...userWithoutPassword } = user.toObject();

    logger.info(`User registered: ${user.email}`);

    return {
      success: true,
      data: userWithoutPassword as IUser,
    };
  } catch (error) {
    logger.error('Registration error:', error);
    return {
      success: false,
      error: error.message,
      statusCode: error instanceof ValidationError ? 400 : 500,
    };
  }
}
```

### Registration Controller

```typescript
register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
    data: result.data,
  });
});
```

## Error Handling

### Custom Error Classes

```typescript
// Base authentication error
export class AuthenticationError extends AppError {
  constructor(message: string) {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

// Authorization error
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

// Token expiry error
export class TokenExpiredError extends AuthenticationError {
  constructor() {
    super('Token has expired');
    this.code = 'TOKEN_EXPIRED';
  }
}
```

### Error Response Format

```typescript
interface ErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: any;
  timestamp: string;
}
```

## Role-Based Access Control

### Role Authorization Middleware

```typescript
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Access denied',
        code: 'ACCESS_DENIED',
      });
      return;
    }

    next();
  };
};

// Usage
router.get('/admin-only', authenticate, authorize(['admin']), handler);
router.get('/admin-or-manager', authenticate, authorize(['admin', 'manager']), handler);
```

## Session Management

### Logout Implementation

```typescript
logout = asyncHandler(async (req: AuthRequest, res: Response): Promise<void> => {
  // In a real application, you might want to blacklist the token
  // For now, we'll just return a success message
  logger.info(`User logged out: ${req.user?.email}`);
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

### Token Blacklisting (Optional)

```typescript
// Redis-based token blacklisting
class TokenBlacklistService {
  private redis: Redis;

  async blacklistToken(token: string, expiresIn: number): Promise<void> {
    const decoded = jwt.decode(token) as JwtPayload;
    const key = `blacklist:${decoded.jti || token}`;
    
    await this.redis.setex(key, expiresIn, 'blacklisted');
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    const decoded = jwt.decode(token) as JwtPayload;
    const key = `blacklist:${decoded.jti || token}`;
    
    const result = await this.redis.get(key);
    return result === 'blacklisted';
  }
}
```

## Configuration

### Environment Variables

```typescript
export const config = {
  security: {
    jwtSecret: envVars.JWT_SECRET,
    jwtExpiresIn: envVars.JWT_EXPIRES_IN || '7d',
    jwtRefreshSecret: envVars.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN || '30d',
    bcryptRounds: parseInt(envVars.BCRYPT_ROUNDS) || 12,
    sessionSecret: envVars.SESSION_SECRET,
  },
};
```

### Validation Schema

```typescript
const envSchema = Joi.object({
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  BCRYPT_ROUNDS: Joi.number().integer().min(10).max(15).default(12),
}).unknown();
```

## API Endpoints

### Authentication Routes

```typescript
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.register);
router.post('/auth/logout', authenticate, authController.logout);
router.post('/auth/refresh-token', authController.refreshToken);
router.get('/auth/profile', authenticate, authController.getProfile);
router.post('/auth/validate-token', authController.validateToken);
router.post('/auth/change-password', authenticate, authController.changePassword);
```

### Request/Response Examples

#### Login Request

```json
POST /api/v1/auth/login
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

#### Login Response

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "_id": "60d5ecb74b24de1234567890",
      "email": "admin@example.com",
      "name": "Administrator",
      "role": "admin",
      "department": "IT",
      "active": true,
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Security Features

### Rate Limiting

```typescript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    error: 'Too many login attempts, please try again later',
    code: 'RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/auth/login', loginLimiter, authController.login);
```

### Input Sanitization

```typescript
const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential script tags
    .substring(0, 255); // Limit length
};
```

### CORS Configuration

```typescript
app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
}));
```

## Testing

### Unit Tests

```typescript
describe('AuthService', () => {
  describe('login', () => {
    test('should login successfully with valid credentials', async () => {
      const mockUser = {
        _id: 'user123',
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        role: 'user',
        active: true,
      };

      userRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.success).toBe(true);
      expect(result.data.user.email).toBe('test@example.com');
      expect(result.data.token).toBeDefined();
    });

    test('should fail login with invalid password', async () => {
      const mockUser = {
        email: 'test@example.com',
        password: await bcrypt.hash('password123', 12),
        active: true,
      };

      userRepository.findByEmail = jest.fn().mockResolvedValue(mockUser);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });
  });
});
```

### Integration Tests

```typescript
describe('Authentication Endpoints', () => {
  test('POST /auth/login should authenticate user', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe('admin@example.com');
  });

  test('GET /auth/profile should return user profile', async () => {
    const loginResponse = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'admin@example.com',
        password: 'Admin123!',
      });

    const token = loginResponse.body.data.token;

    const response = await request(app)
      .get('/api/v1/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.email).toBe('admin@example.com');
  });
});
```

## Best Practices

1. **Password Security**: Use bcrypt with high salt rounds (12+)
2. **Token Expiry**: Keep access tokens short-lived (15 minutes - 1 hour)
3. **Refresh Tokens**: Use longer-lived refresh tokens (days/weeks)
4. **Rate Limiting**: Implement aggressive rate limiting for auth endpoints
5. **Input Validation**: Validate and sanitize all inputs
6. **Error Messages**: Don't reveal whether email exists during login
7. **Logging**: Log authentication events for security monitoring
8. **HTTPS Only**: Always use HTTPS in production

## Monitoring and Logging

### Authentication Events

```typescript
// Successful login
logger.info('User login successful', {
  userId: user._id,
  email: user.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  timestamp: new Date(),
});

// Failed login attempt
logger.warn('Failed login attempt', {
  email: credentials.email,
  ip: req.ip,
  userAgent: req.headers['user-agent'],
  error: 'Invalid credentials',
  timestamp: new Date(),
});
```

### Security Alerts

```typescript
const alertOnSuspiciousActivity = (event: SecurityEvent) => {
  if (event.failedAttempts > 5) {
    logger.error('Multiple failed login attempts detected', event);
    // Send alert to security team
  }
};
```

## Future Enhancements

- **Multi-Factor Authentication (MFA)**: SMS/Email/TOTP support
- **OAuth Integration**: Social login providers
- **Session Management**: Active session tracking and termination
- **Biometric Authentication**: Fingerprint/Face ID support
- **Password Reset**: Secure password recovery flow
- **Account Lockout**: Temporary lockout after failed attempts
- **Audit Logging**: Comprehensive security event logging