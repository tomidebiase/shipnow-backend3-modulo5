import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT ||= '3000';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/shipnow';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const server = app.listen(0);

const request = async (url) => {
  const { port } = server.address();
  const response = await fetch(`http://127.0.0.1:${port}${url}`);
  return { status: response.status, body: await response.json() };
};

test('el endpoint de prueba genera los seis niveles y responde 200', async () => {
  const result = await request('/api/logger/test');
  assert.equal(result.status, 200);
  assert.equal(result.body.status, 'success');
  assert.deepEqual(result.body.levels, ['debug', 'http', 'info', 'warning', 'error', 'fatal']);
});

test('el formato de errores HTTP del Módulo 3 sigue intacto', async () => {
  const result = await request('/api/mocks/users?qty=-3');
  assert.equal(result.status, 400);
  assert.deepEqual(Object.keys(result.body.error), ['code', 'message']);
  assert.equal(result.body.error.code, 'INVALID_MOCK_QUANTITY');
});

test.after(() => new Promise(resolve => server.close(resolve)));
