import test from 'node:test';
import assert from 'node:assert/strict';
import { errorHandler } from '../src/middlewares/error-handler.js';
import { UserNotFoundError, InvalidMockQuantityError } from '../src/errors/domain-errors.js';

const apply = (error) => {
  let statusCode;
  let body;
  const res = {
    headersSent: false,
    status(code) { statusCode = code; return this; },
    json(payload) { body = payload; return this; }
  };
  errorHandler(error, {}, res, () => { throw new Error('No debería pasar al siguiente middleware'); });
  return { statusCode, body };
};

test('errores conocidos comparten una estructura JSON predecible', () => {
  const a = apply(new UserNotFoundError());
  const b = apply(new InvalidMockQuantityError());
  assert.deepEqual(Object.keys(a.body), ['status', 'error']);
  assert.deepEqual(Object.keys(a.body.error), ['code', 'message']);
  assert.deepEqual(Object.keys(b.body), ['status', 'error']);
  assert.deepEqual(Object.keys(b.body.error), ['code', 'message']);
  assert.equal(a.statusCode, 404);
  assert.equal(b.statusCode, 400);
  assert.equal(a.body.error.code, 'USER_NOT_FOUND');
  assert.equal(b.body.error.code, 'INVALID_MOCK_QUANTITY');
});

test('los errores de express y mongo usan el mismo formato', () => {
  assert.equal(apply({ type: 'entity.parse.failed' }).body.error.code, 'INVALID_JSON');
  assert.equal(apply({ code: 11000 }).body.error.code, 'DUPLICATE_RECORD');
});

test('errores inesperados no revelan detalles internos al consumidor', () => {
  const previousLog = console.error;
  console.error = () => {};
  try {
    const result = apply(new Error('clave-secreta'));
    assert.equal(result.statusCode, 500);
    assert.deepEqual(result.body, {
      status: 'error',
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor' }
    });
  } finally {
    console.error = previousLog;
  }
});

test('cuando ya se enviaron headers la excepción se reenvía', () => {
  const error = new Error('Error de stream');
  let forwarded;
  errorHandler(error, {}, { headersSent: true }, incoming => { forwarded = incoming; });
  assert.equal(forwarded, error);
});
