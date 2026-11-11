import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';
import winston from 'winston';
import { createAppLogger, LOG_LEVELS, LOG_ROTATION } from '../src/config/logger.js';

const makeLogger = (options) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'shipnow-logger-'));
  const logger = createAppLogger({ logDir: directory, consoleEnabled: false, ...options });
  return { logger, directory };
};

const closeLogger = async (logger) => {
  const finished = once(logger, 'finish');
  logger.end();
  await finished;
};

test('los seis niveles tienen el orden correcto de gravedad', () => {
  assert.deepEqual(LOG_LEVELS, {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5
  });
  assert.ok(Object.isFrozen(LOG_LEVELS));
});

test('la rotación limita el tamaño y la cantidad de archivos', () => {
  assert.equal(LOG_ROTATION.maxsize, 5 * 1024 * 1024);
  assert.equal(LOG_ROTATION.maxFiles, 7);
  assert.equal(LOG_ROTATION.tailable, true);
});

test('desarrollo registra debug y producción restringe la consola a info', async () => {
  const dev = makeLogger({ nodeEnv: 'development', consoleEnabled: true });
  const prod = makeLogger({ nodeEnv: 'production', consoleEnabled: true });

  try {
    const consoleDev = dev.logger.transports.find(transport => transport instanceof winston.transports.Console);
    const consoleProd = prod.logger.transports.find(transport => transport instanceof winston.transports.Console);
    assert.equal(consoleDev.level, 'debug');
    assert.equal(consoleProd.level, 'info');
  } finally {
    await Promise.all([closeLogger(dev.logger), closeLogger(prod.logger)]);
    rmSync(dev.directory, { recursive: true, force: true });
    rmSync(prod.directory, { recursive: true, force: true });
  }
});

test('error.log contiene solo error y fatal, con timestamp y nivel', async () => {
  const { logger, directory } = makeLogger({ nodeEnv: 'development' });
  try {
    for (const level of Object.keys(LOG_LEVELS)) {
      logger.log(level, `Evento ${level} de prueba`);
    }
    await closeLogger(logger);

    const content = readFileSync(path.join(directory, 'error.log'), 'utf8');
    assert.match(content, /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} \[fatal\] Evento fatal de prueba/);
    assert.match(content, /\[error\] Evento error de prueba/);
    for (const level of ['warning', 'info', 'http', 'debug']) {
      assert.ok(!content.includes(`Evento ${level} de prueba`));
    }
  } finally {
    logger.close();
    rmSync(directory, { recursive: true, force: true });
  }
});

test('el archivo de errores conserva límites de rotación configurados', async () => {
  const { logger, directory } = makeLogger();
  try {
    const fileTransport = logger.transports.find(transport => transport instanceof winston.transports.File);
    assert.equal(fileTransport.level, 'error');
    assert.equal(fileTransport.maxsize, LOG_ROTATION.maxsize);
    assert.equal(fileTransport.maxFiles, LOG_ROTATION.maxFiles);
    assert.equal(fileTransport.tailable, LOG_ROTATION.tailable);
    await closeLogger(logger);
  } finally {
    logger.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
