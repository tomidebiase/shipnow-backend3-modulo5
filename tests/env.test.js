import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

const loadConfig = (overrides) => spawnSync(
  process.execPath,
  ['src/config/env.config.js'],
  {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: {
      PORT: '3000',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/shipnow_test',
      NODE_ENV: 'test',
      ...overrides
    }
  }
);

test('el arranque falla si falta MONGODB_URI', () => {
  const result = loadConfig({ MONGODB_URI: '' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MONGODB_URI/);
});

test('el arranque falla si falta PORT', () => {
  const result = loadConfig({ PORT: '' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /PORT/);
});

test('el arranque falla si falta NODE_ENV', () => {
  const result = loadConfig({ NODE_ENV: '' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /NODE_ENV/);
});

test('el arranque acepta configuración válida', () => {
  const result = loadConfig({});
  assert.equal(result.status, 0, result.stderr);
});
