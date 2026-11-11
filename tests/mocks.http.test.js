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
  const json = await response.json();
  return { status: response.status, json };
};

test('GET /api/mocks/users devuelve exactamente qty registros', async () => {
  const result = await request('/api/mocks/users?qty=2');
  assert.equal(result.status, 200);
  assert.equal(result.json.length, 2);
  assert.ok(result.json.every(item => item.email && item.role));
});

test('GET /api/mocks/bundle entrega referencias coherentes', async () => {
  const result = await request('/api/mocks/bundle?qty=3');
  assert.equal(result.status, 200);
  assert.equal(result.json.orders.length, 3);
  assert.equal(result.json.deliveries.length, 3);
  assert.ok(result.json.orders.every(order => result.json.users.some(user => user._id === order.user)));
});

test('un qty incorrecto responde HTTP 400', async () => {
  const result = await request('/api/mocks/users?qty=0');
  assert.equal(result.status, 400);
});

test('JSON malformado devuelve HTTP 400', async () => {
  const result = await request('/api/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"name":'
  });
  assert.equal(result.status, 400);
});

test('ID de usuario inválido devuelve HTTP 400', async () => {
  const result = await request('/api/users/no-es-un-id');
  assert.equal(result.status, 400);
});

test('ID de producto inválido devuelve HTTP 400', async () => {
  const result = await request('/api/products/no-es-un-id');
  assert.equal(result.status, 400);
});

test('la carga con qty inválido falla sin acceder a MongoDB', async () => {
  const result = await request('/api/mocks/seed?qty=0', { method: 'POST' });
  assert.equal(result.status, 400);
});

test('la carga completa con qty inválido falla antes de escribir', async () => {
  const result = await request('/api/mocks/seed/all?qty=101', { method: 'POST' });
  assert.equal(result.status, 400);
});

test.after(() => new Promise(resolve => server.close(resolve)));

