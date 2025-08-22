import winston from 'winston';
import { config } from '@/config/environment';
import path from 'path';

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
  })
);

// Create transports
const transports: winston.transport[] = [];

// Console transport
if (config.isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
      level: config.logging.level,
    })
  );
}

// File transport
if (config.logging.file) {
  const logDir = path.dirname(config.logging.file);
  
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      format: logFormat,
      level: config.logging.level,
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );

  // Separate error log
  transports.push(
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      format: logFormat,
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exceptionHandlers: transports,
  rejectionHandlers: transports,
});

// Stream for Morgan HTTP logging
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Helper methods
export const loggerHelpers = {
  logError: (error: Error, context?: any) => {
    logger.error({
      message: error.message,
      stack: error.stack,
      context,
    });
  },

  logRequest: (req: any, startTime: number) => {
    const duration = Date.now() - startTime;
    logger.info({
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      duration: `${duration}ms`,
    });
  },

  logDBOperation: (operation: string, collection: string, duration?: number) => {
    logger.debug({
      type: 'database',
      operation,
      collection,
      duration: duration ? `${duration}ms` : undefined,
    });
  },
};

export default logger;