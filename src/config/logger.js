import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import winston from 'winston';

const projectRoot = fileURLToPath(new URL('../../', import.meta.url));

export const LOG_LEVELS = Object.freeze({
  fatal: 0,
  error: 1,
  warning: 2,
  info: 3,
  http: 4,
  debug: 5
});

export const LOG_ROTATION = Object.freeze({
  maxsize: 5 * 1024 * 1024,
  maxFiles: 7,
  tailable: true
});

const outputFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...details }) => {
    const metadata = Object.keys(details).length > 0 ? ` ${JSON.stringify(details)}` : '';
    return `${timestamp} [${level}] ${message}${metadata}`;
  })
);

export const createAppLogger = ({
  nodeEnv = process.env.NODE_ENV ?? 'development',
  logDir = path.join(projectRoot, 'logs'),
  consoleEnabled = nodeEnv !== 'test',
  maxsize = LOG_ROTATION.maxsize,
  maxFiles = LOG_ROTATION.maxFiles
} = {}) => {
  mkdirSync(logDir, { recursive: true });

  const transports = [
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize,
      maxFiles,
      tailable: true
    })
  ];

  if (consoleEnabled) {
    transports.unshift(new winston.transports.Console({
      level: nodeEnv === 'production' ? 'info' : 'debug'
    }));
  }

  return winston.createLogger({
    levels: LOG_LEVELS,
    level: 'debug',
    format: outputFormat,
    transports,
    exitOnError: false
  });
};

export const logger = createAppLogger();
