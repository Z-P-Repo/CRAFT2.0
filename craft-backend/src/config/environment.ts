import dotenv from 'dotenv';
import Joi from 'joi';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3001),
  API_PREFIX: Joi.string().default('/api/v1'),
  
  // Database
  MONGODB_URI: Joi.string().required(),
  MONGODB_TEST_URI: Joi.string().optional(),
  
  // JWT
  JWT_SECRET: Joi.string().required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  JWT_REFRESH_SECRET: Joi.string().optional(),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),
  
  // CORS
  FRONTEND_URL: Joi.string().default('http://localhost:3000'),
  ALLOWED_ORIGINS: Joi.string().default('http://localhost:3000,http://localhost:3001,http://192.168.10.83:3000,http://192.168.10.83:3001'),
  
  // Security
  BCRYPT_ROUNDS: Joi.number().default(12),
  SESSION_SECRET: Joi.string().optional(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000), // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  
  // Logging
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FILE: Joi.string().default('logs/app.log'),
  
  // Redis (optional)
  REDIS_URL: Joi.string().optional(),
  REDIS_TTL: Joi.number().default(3600),
  
  // Email (optional)
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().optional(),
  SMTP_PASS: Joi.string().optional(),
  
  // Azure AD SSO
  AZURE_AD_CLIENT_ID: Joi.string().optional(),
  AZURE_AD_CLIENT_SECRET: Joi.string().optional(),
  AZURE_AD_TENANT_ID: Joi.string().optional(),
  AZURE_AD_AUTHORITY: Joi.string().optional(),
  AZURE_AD_REDIRECT_URI: Joi.string().optional(),
}).unknown();

const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

export const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  apiPrefix: envVars.API_PREFIX,
  
  mongodb: {
    uri: envVars.MONGODB_URI,
    testUri: envVars.MONGODB_TEST_URI,
  },
  
  jwt: {
    secret: envVars.JWT_SECRET,
    expiresIn: envVars.JWT_EXPIRES_IN,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    refreshExpiresIn: envVars.JWT_REFRESH_EXPIRES_IN,
  },
  
  cors: {
    frontendUrl: envVars.FRONTEND_URL,
    allowedOrigins: envVars.ALLOWED_ORIGINS.split(',').map((origin: string) => origin.trim()),
  },
  
  security: {
    bcryptRounds: envVars.BCRYPT_ROUNDS,
    sessionSecret: envVars.SESSION_SECRET,
  },
  
  rateLimit: {
    windowMs: envVars.RATE_LIMIT_WINDOW_MS,
    maxRequests: envVars.RATE_LIMIT_MAX_REQUESTS,
  },
  
  logging: {
    level: envVars.LOG_LEVEL,
    file: envVars.LOG_FILE,
  },
  
  redis: {
    url: envVars.REDIS_URL,
    ttl: envVars.REDIS_TTL,
  },
  
  email: {
    host: envVars.SMTP_HOST,
    port: envVars.SMTP_PORT,
    user: envVars.SMTP_USER,
    pass: envVars.SMTP_PASS,
  },
  
  azureAd: {
    clientId: envVars.AZURE_AD_CLIENT_ID,
    clientSecret: envVars.AZURE_AD_CLIENT_SECRET,
    tenantId: envVars.AZURE_AD_TENANT_ID,
    authority: envVars.AZURE_AD_AUTHORITY || `https://login.microsoftonline.com/${envVars.AZURE_AD_TENANT_ID}`,
    redirectUri: envVars.AZURE_AD_REDIRECT_URI || `${envVars.FRONTEND_URL}/auth/callback`,
    enabled: !!(
      envVars.AZURE_AD_CLIENT_ID &&
      envVars.AZURE_AD_CLIENT_SECRET &&
      envVars.AZURE_AD_TENANT_ID &&
      !envVars.AZURE_AD_CLIENT_SECRET.includes('your-') &&
      !envVars.AZURE_AD_CLIENT_SECRET.includes('placeholder') &&
      envVars.AZURE_AD_CLIENT_SECRET.length > 20
    ),
  },
  
  // Computed values
  isDevelopment: envVars.NODE_ENV === 'development',
  isProduction: envVars.NODE_ENV === 'production',
  isTest: envVars.NODE_ENV === 'test',
};

export default config;