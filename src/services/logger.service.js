import { logger } from '../config/logger.js';
import { DomainError } from '../errors/domain-errors.js';

const sampleMessages = Object.freeze({
  debug: 'Verificación del logger: detalle de depuración',
  http: 'Verificación del logger: actividad HTTP',
  info: 'Verificación del logger: evento informativo',
  warning: 'Verificación del logger: advertencia de prueba',
  error: 'Verificación del logger: error de prueba',
  fatal: 'Verificación del logger: falla crítica de prueba'
});

export const testLogger = () => {
  if (process.env.NODE_ENV === 'production') {
    throw new DomainError('LOGGER_TEST_DISABLED');
  }

  for (const [level, message] of Object.entries(sampleMessages)) {
    logger.log(level, message, { source: 'logger-test' });
  }

  return { status: 'success', levels: Object.keys(sampleMessages), message: 'Eventos de prueba registrados' };
};
