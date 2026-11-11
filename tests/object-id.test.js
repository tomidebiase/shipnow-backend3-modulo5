import test from 'node:test';
import assert from 'node:assert/strict';
import { assertValidObjectId } from '../src/utils/object-id.js';

test('el identificador válido de MongoDB se acepta', () => {
  assert.doesNotThrow(() => assertValidObjectId('6ae76b2e813a14ee8ae54e42'));
});

test('un ID mal formado devuelve error 400 en vez de 404', () => {
  for (const id of ['no-es-un-id', '', '123', 'x'.repeat(24), null]) {
    assert.throws(() => assertValidObjectId(id), error => error.statusCode === 400);
  }
});

