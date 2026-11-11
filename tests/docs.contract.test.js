import test from 'node:test';
import assert from 'node:assert/strict';

process.env.PORT ||= '3000';
process.env.MONGODB_URI ||= 'mongodb://127.0.0.1:27017/shipnow';
process.env.NODE_ENV = 'test';

const { openapiSpec } = await import('../src/docs/openapi.js');

const getOperations = () => Object.entries(openapiSpec.paths).flatMap(([path, pathItem]) =>
  Object.entries(pathItem)
    .filter(([method]) => ['get', 'post', 'put', 'patch', 'delete'].includes(method))
    .map(([method, operation]) => ({ path, method, operation }))
);

test('OpenAPI 3 con título, versión, servidor local y propósito', () => {
  assert.equal(openapiSpec.openapi, '3.0.3');
  assert.equal(openapiSpec.info.title, 'ShipNow API');
  assert.ok(openapiSpec.info.version);
  assert.match(openapiSpec.info.description, /API REST ShipNow/);
  assert.ok(openapiSpec.servers.some(server => server.url === 'http://localhost:3000'));
});

test('las operaciones están organizadas por los seis módulos reales', () => {
  const names = openapiSpec.tags.map(tag => tag.name);
  for (const name of ['Users', 'Orders', 'Deliveries', 'Mocks', 'Logger', 'Products']) {
    assert.ok(names.includes(name));
    assert.ok(getOperations().some(({ operation }) => operation.tags.includes(name)));
  }
  assert.equal(getOperations().length, 20);
});

test('los paths y métodos documentados coinciden con los routers Express', async () => {
  const routers = {
    '/api/users': (await import('../src/routes/users.router.js')).default,
    '/api/orders': (await import('../src/routes/orders.router.js')).default,
    '/api/deliveries': (await import('../src/routes/deliveries.router.js')).default,
    '/api/mocks': (await import('../src/routes/mocks.router.js')).default,
    '/api/logger': (await import('../src/routes/logger.router.js')).default,
    '/api/products': (await import('../src/routes/products.router.js')).default
  };
  const actual = [];
  for (const [prefix, router] of Object.entries(routers)) {
    for (const layer of router.stack) {
      if (!layer.route) continue;
      const route = prefix + (layer.route.path === '/' ? '' : layer.route.path.replace(/:([a-zA-Z]+)/g, '{$1}'));
      for (const method of Object.keys(layer.route.methods)) {
        actual.push(`${method.toUpperCase()} ${route}`);
      }
    }
  }
  const documented = getOperations().map(({ path, method }) => `${method.toUpperCase()} ${path}`);
  assert.deepEqual(documented.sort(), actual.sort());
});

test('las referencias de schemas apuntan a definiciones existentes', () => {
  const names = Object.keys(openapiSpec.components.schemas);
  for (const required of ['Usuario', 'Pedido', 'Entrega', 'ItemPedido', 'Error', 'RespuestaExitosa']) {
    assert.ok(names.includes(required));
  }
  const seen = new Set();
  const visit = (node) => {
    if (!node || typeof node !== 'object' || seen.has(node)) return;
    seen.add(node);
    if (node.$ref) {
      assert.match(node.$ref, /^#\/components\/schemas\//);
      assert.ok(names.includes(node.$ref.split('/').at(-1)), node.$ref);
    }
    for (const value of Object.values(node)) visit(value);
  };
  visit(openapiSpec);
});

test('cada operación incluye descripción, éxito y errores adecuados', () => {
  for (const { path, method, operation } of getOperations()) {
    assert.ok(operation.summary && operation.summary.length > 3, `${method} ${path}`);
    assert.ok(operation.responses && Object.keys(operation.responses).some(code => /^2/.test(code)));
    for (const [status, response] of Object.entries(operation.responses)) {
      assert.ok(response.description, `${method} ${path} ${status}`);
      if (Number(status) >= 400) {
        assert.equal(response.content['application/json'].schema.$ref, '#/components/schemas/Error');
      }
    }
  }
});

test('los parámetros de ruta y cuerpos declarados corresponden a sus métodos', () => {
  for (const { path, method, operation } of getOperations()) {
    if (path.includes('{id}')) {
      assert.ok(operation.parameters?.some(p => p.name === 'id' && p.in === 'path' && p.required));
    }
    if ((method === 'post' || method === 'patch') && !path.startsWith('/api/mocks')) {
      assert.ok(operation.requestBody?.content?.['application/json']);
    }
    if (method === 'delete') {
      assert.ok(operation.responses['204']);
      assert.ok(!operation.responses['204'].content);
    }
  }
});

test('la documentación de mocks coincide con la validación del servicio', () => {
  const operations = getOperations().filter(({ path }) => path.startsWith('/api/mocks'));
  assert.equal(operations.length, 7);
  for (const { operation } of operations) {
    const param = operation.parameters.find(parameter => parameter.name === 'qty');
    assert.equal(param.schema.minimum, 1);
    assert.equal(param.schema.maximum, 100);
    assert.equal(param.schema.default, 10);
    assert.ok(operation.responses['400']);
  }
  for (const path of ['/api/mocks/seed', '/api/mocks/seed/all']) {
    const operation = openapiSpec.paths[path].post;
    assert.ok(operation.responses['201']);
    assert.ok(operation.responses['403']);
    assert.ok(operation.responses['503']);
    assert.equal(operation.requestBody.required, false);
    assert.equal(operation.requestBody.content['application/json'].schema.maxProperties, 0);
  }
  const orderParams = openapiSpec.paths['/api/mocks/orders'].get.parameters.map(p => p.name);
  assert.ok(orderParams.includes('status'));
  assert.ok(orderParams.includes('priority'));
});

test('el logger se documenta como herramienta interna restringida en producción', () => {
  const op = openapiSpec.paths['/api/logger/test'].get;
  assert.match(op.description, /herramienta|validación|interna/i);
  assert.match(op.description, /producción/i);
  assert.ok(op.responses['403']);
});

test('no se documentan rutas de creación inexistentes para pedidos o entregas', () => {
  assert.ok(!openapiSpec.paths['/api/orders']);
  assert.ok(!openapiSpec.paths['/api/deliveries']);
  assert.ok(!openapiSpec.paths['/api/orders/{id}'].post);
  assert.ok(!openapiSpec.paths['/api/deliveries/{id}'].post);
  assert.match(openapiSpec.components.schemas.ItemPedido.description, /futura/);
  assert.ok(!openapiSpec.components.schemas.Pedido.properties.items);
});

test('las respuestas JSON generales y los arrays de mocks están diferenciados', () => {
  const user = openapiSpec.paths['/api/users'].get.responses['200'].content['application/json'].schema;
  assert.equal(user.allOf[0].$ref, '#/components/schemas/RespuestaExitosa');
  const mockUsers = openapiSpec.paths['/api/mocks/users'].get.responses['200'].content['application/json'].schema;
  assert.equal(mockUsers.type, 'array');
  assert.equal(mockUsers.items.$ref, '#/components/schemas/Usuario');
});
