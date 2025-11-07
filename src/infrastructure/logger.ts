/**
 * Production Logging System
 * Uses Winston for structured logging
 */

import winston from 'winston';
import config from '../config';

const logLevel = config.get('logging.level');
const logFormat = config.get('logging.format');
const env = config.get('env');

// Define log format
const formats: winston.Logform.Format[] = [
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
];

// Add JSON format for production
if (logFormat === 'json' || env === 'production') {
  formats.push(winston.format.json());
} else {
  // Simple colorized format for development
  formats.push(
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
      return `${timestamp} [${level}]: ${message} ${metaStr}`;
    })
  );
}

// Create logger instance
const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(...formats),
  defaultMeta: { service: 'domain-brainstormer' },
  transports: [
    new winston.transports.Console({
      silent: env === 'test' // Silence logs during tests
    })
  ]
});

// Add file transports in production
if (env === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  );
  logger.add(
    new winston.transports.File({
      filename: 'logs/combined.log',
      maxsize: 5242880,
      maxFiles: 5
    })
  );
}

// Create child logger for specific modules
export function createModuleLogger(module: string): winston.Logger {
  return logger.child({ module });
}

export default logger;
