import 'reflect-metadata';
import './types/express-augmentation';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import http from 'http';
import morgan from 'morgan';

// Import configuration and utilities
import { config } from '@/config/environment';
import { databaseConnection } from '@/config/database';
import { logger, loggerStream } from '@/utils/logger';

// Import middleware
import { helmetConfig, securityHeaders, apiRateLimit } from '@/middleware/security';
import { errorHandler, notFoundHandler } from '@/middleware/errorHandler';

// Import routes
import routes from '@/routes';

class Server {
  private app: express.Application;
  private readonly port: number;

  constructor() {
    this.app = express();
    this.port = config.port;
    
    this.initializeMiddleware();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddleware(): void {
    // Security middleware - temporarily disabled for debugging
    // this.app.use(helmetConfig);
    this.app.use(securityHeaders);

    // CORS configuration
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Origin',
        'X-Requested-With',
        'Content-Type',
        'Accept',
        'Authorization',
        'X-Request-ID',
      ],
    }));

    // Compression and parsing middleware
    this.app.use(compression());
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging middleware
    if (config.isDevelopment) {
      this.app.use(morgan('combined', { stream: loggerStream }));
    }

    // Rate limiting - temporarily disabled for debugging
    // this.app.use(apiRateLimit);

    // Request ID middleware
    this.app.use((req, res, next) => {
      req.headers['x-request-id'] = req.headers['x-request-id'] ||
        `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      next();
    });

    // Temporary debug middleware for external access
    this.app.use((req, res, next) => {
      console.log(`Request from: ${req.ip}, Host: ${req.get('host')}, URL: ${req.url}`);
      next();
    });
  }

  private initializeRoutes(): void {
    // Mount API routes
    this.app.use(config.apiPrefix, routes);

    // Root endpoint
    this.app.get('/', (req, res) => {
      res.json({
        message: 'CRAFT ABAC Permission System API',
        version: '1.0.0',
        status: 'running',
        timestamp: new Date().toISOString(),
        documentation: `${req.protocol}://${req.get('host')}${config.apiPrefix}/info`,
      });
    });
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);
    
    // Global error handler
    this.app.use(errorHandler);
  }

  public async start(): Promise<any> {
    try {
      // Connect to database
      await databaseConnection.connect();
      
      // Create HTTP server with increased header size limits to prevent 431 errors
      const server = http.createServer(this.app);

      // Set server options to handle large headers (JWT tokens, etc.)
      server.maxHeadersCount = 1000;
      server.headersTimeout = 60000; // 60 seconds
      server.requestTimeout = 60000; // 60 seconds

      // Start server with error handling
      server.listen(this.port, '0.0.0.0', () => {
        logger.info(`✅ Server running on port ${this.port}`);
        logger.info(`🌍 Environment: ${config.env}`);
        logger.info(`📊 Health check: http://localhost:${this.port}/health`);
        logger.info(`📚 API info: http://localhost:${this.port}${config.apiPrefix}/info`);
        
        if (config.isDevelopment) {
          logger.info(`🔧 Development mode enabled`);
        }
      });

      // Handle server errors
      server.on('error', (error: any) => {
        if (error.code === 'EADDRINUSE') {
          logger.error(`❌ Port ${this.port} is already in use`);
          logger.info(`💡 Try running: lsof -ti:${this.port} | xargs kill -9`);
          process.exit(1);
        } else {
          logger.error('Server error:', error);
          process.exit(1);
        }
      });

      // Graceful shutdown handlers
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  private setupGracefulShutdown(): void {
    const gracefulShutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      
      try {
        // Close database connection
        await databaseConnection.disconnect();
        logger.info('Database connection closed');
        
        // Exit process
        logger.info('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during graceful shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different termination signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });
  }
}

// Create and start server
const server = new Server();
server.start().catch((error) => {
  logger.error('Server startup failed:', error);
  process.exit(1);
});

export default server;