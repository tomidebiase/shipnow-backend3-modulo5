import { performance } from 'node:perf_hooks';
import { logger } from '../config/logger.js';

export const requestLogger = (req, res, next) => {
  const startedAt = performance.now();

  res.once('finish', () => {
    logger.http('Solicitud HTTP completada', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(performance.now() - startedAt)
    });
  });

  next();
};
