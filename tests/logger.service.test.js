import test from 'node:test';
import assert from 'node:assert/strict';
import { testLogger } from '../src/services/logger.service.js';

test('la prueba del logger está deshabilitada en producción', () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.throws(() => testLogger(), error => error.code === 'LOGGER_TEST_DISABLED' && error.statusCode === 403);
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previous;
  }
});
