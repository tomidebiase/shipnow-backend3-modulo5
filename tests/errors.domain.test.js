import test from 'node:test';
import assert from 'node:assert/strict';
import { ERROR_DICTIONARY } from '../src/errors/error-dictionary.js';
import {
  DomainError,
  UserNotFoundError,
  ProductNotFoundError,
  OrderNotFoundError,
  InvalidOrderStatusError,
  InvalidMockQuantityError,
  MockSeedError
} from '../src/errors/domain-errors.js';
import { normalizeError } from '../src/errors/normalize-error.js';

const expectError = (error, code, statusCode) => {
  assert.equal(error.code, code);
  assert.equal(error.statusCode, statusCode);
  assert.ok(error.message.length > 0);
};

test('diccionario de errores inmutable y con códigos HTTP válidos', () => {
  assert.ok(Object.isFrozen(ERROR_DICTIONARY));
  for (const value of Object.values(ERROR_DICTIONARY)) {
    assert.ok(Object.isFrozen(value));
    assert.ok(value.statusCode >= 400 && value.statusCode <= 599);
  }
});

test('los errores de dominio contienen códigos y estados correctos', () => {
  expectError(new UserNotFoundError(), 'USER_NOT_FOUND', 404);
  expectError(new ProductNotFoundError(), 'PRODUCT_NOT_FOUND', 404);
  expectError(new OrderNotFoundError(), 'ORDER_NOT_FOUND', 404);
  expectError(new InvalidOrderStatusError(), 'INVALID_ORDER_STATUS', 400);
  expectError(new InvalidMockQuantityError(), 'INVALID_MOCK_QUANTITY', 400);
});

test('no se pueden crear errores con códigos inexistentes', () => {
  assert.throws(() => new DomainError('NO_EXISTE'), TypeError);
});

test('JSON malformado se transforma a un error público 400', () => {
  expectError(normalizeError({ type: 'entity.parse.failed' }), 'INVALID_JSON', 400);
});

test('MongoDB duplicado y validación de esquema reciben códigos uniformes', () => {
  expectError(normalizeError({ code: 11000 }), 'DUPLICATE_RECORD', 409);
  expectError(normalizeError({ name: 'ValidationError' }), 'INVALID_INPUT', 400);
  expectError(normalizeError({ name: 'CastError' }), 'INVALID_INPUT', 400);
});

test('errores de conexión a MongoDB se traducen a 503', () => {
  expectError(normalizeError({ name: 'MongoServerSelectionError' }), 'DATABASE_UNAVAILABLE', 503);
});

test('un error interno no expone el mensaje de la excepción original', () => {
  const result = normalizeError(new Error('contraseña-de-la-base'));
  expectError(result, 'INTERNAL_ERROR', 500);
  assert.ok(!result.message.includes('contraseña-de-la-base'));
});

test('la excepción de carga conserva la causa para diagnóstico, no para el cliente', () => {
  const cause = new Error('Información interna de MongoDB');
  const error = new MockSeedError(cause);
  expectError(error, 'MOCK_SEED_FAILED', 503);
  assert.equal(error.cause, cause);
  assert.ok(!error.message.includes('MongoDB'));
});
