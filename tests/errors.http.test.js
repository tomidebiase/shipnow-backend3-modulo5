import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT ||= '3000';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/shipnow';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const server = app.listen(0);

const request = async (path, options = {}) => {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${path}`, options);
  const body = await response.json();
  return { statusCode: response.status, body };
};

const expectError = (result, statusCode, code) => {
  assert.equal(result.statusCode, statusCode);
  assert.deepEqual(Object.keys(result.body), ['status', 'error']);
  assert.equal(result.body.status, 'error');
  assert.deepEqual(Object.keys(result.body.error), ['code', 'message']);
  assert.equal(result.body.error.code, code);
  assert.ok(result.body.error.message.length > 0);
};

test('una ruta desconocida usa el middleware global', async () => {
  expectError(await request('/api/ruta-que-no-existe'), 404, 'ROUTE_NOT_FOUND');
});

test('un ID inválido de usuario usa error del dominio', async () => {
  expectError(await request('/api/users/no-es-un-id'), 400, 'INVALID_ID');
});

test('un ID inválido de producto usa error del dominio', async () => {
  expectError(await request('/api/products/no-es-un-id'), 400, 'INVALID_ID');
});

test('un ID inválido de pedido usa el mismo formato', async () => {
  expectError(await request('/api/orders/no-es-un-id'), 400, 'INVALID_ID');
});

test('un JSON malformado se responde desde el manejador global', async () => {
  const result = await request('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"firstName":'
  });
  expectError(result, 400, 'INVALID_JSON');
});

test('los valores negativos de qty responden con error tipificado', async () => {
  expectError(await request('/api/mocks/users?qty=-10'), 400, 'INVALID_MOCK_QUANTITY');
});

test('un estado inválido de pedido se deriva al middleware', async () => {
  expectError(await request('/api/mocks/orders?qty=2&status=ilegal'), 400, 'INVALID_ORDER_STATUS');
});

test('una prioridad inválida de pedido se deriva al middleware', async () => {
  expectError(await request('/api/mocks/orders?qty=2&priority=urgente'), 400, 'INVALID_ORDER_PRIORITY');
});

test('una carga con datos incorrectos no llega a MongoDB', async () => {
  const result = await request('/api/mocks/seed/all?qty=2', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ qty: -4 })
  });
  expectError(result, 400, 'INVALID_MOCK_DATA');
});

test('parámetros adicionales incorrectos producen error uniforme', async () => {
  expectError(await request('/api/mocks/bundle?qty=2&unexpected=true'), 400, 'INVALID_MOCK_DATA');
});

test.after(() => new Promise(resolve => server.close(resolve)));
