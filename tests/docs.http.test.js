import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT ||= '3000';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/shipnow';
process.env.NODE_ENV = 'test';

const { default: app } = await import('../src/app.js');
const { openapiSpec } = await import('../src/docs/openapi.js');
const server = app.listen(0);

const request = async (route) => {
  const { port } = server.address();
  return fetch(`http://127.0.0.1:${port}${route}`);
};

test('Swagger UI está disponible en /api/docs/', async () => {
  const response = await request('/api/docs/');
  const html = await response.text();
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type'), /text\/html/);
  assert.match(html, /Swagger UI/i);
});

test('OpenAPI JSON se publica en una ruta separada', async () => {
  const response = await request('/api/docs/openapi.json');
  assert.equal(response.status, 200);
  const spec = await response.json();
  assert.equal(spec.openapi, '3.0.3');
  assert.deepEqual(spec.info, openapiSpec.info);
  assert.equal(Object.keys(spec.paths).length, 14);
});

test('la consulta nueva de entregas acepta solo ObjectId válidos', async () => {
  const response = await request('/api/deliveries/id-invalido');
  assert.equal(response.status, 400);
  const payload = await response.json();
  assert.equal(payload.status, 'error');
  assert.equal(payload.error.code, 'INVALID_ID');
});

test.after(() => new Promise(resolve => server.close(resolve)));
