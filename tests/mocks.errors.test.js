import test from 'node:test';
import assert from 'node:assert/strict';
import { createMocksService, parseMockQuantity } from '../src/services/mocks.service.js';
import { ORDER_STATUS, ORDER_PRIORITY } from '../src/constants/index.js';

const repository = () => ({
  calls: 0,
  async insertUsers(items) { this.calls++; return items.length; },
  async insertBundle(bundle) {
    this.calls++;
    return {
      usuarios: bundle.users.length + bundle.couriers.length,
      repartidores: bundle.couriers.length,
      pedidos: bundle.orders.length,
      entregas: bundle.deliveries.length
    };
  }
});

test('qty negativo, decimal, cero o excesivo produce un error tipificado', () => {
  for (const value of ['-5', '0', '2.5', '101', 'abc', ['1', '2']]) {
    assert.throws(() => parseMockQuantity(value), error =>
      error.code === 'INVALID_MOCK_QUANTITY' && error.statusCode === 400
    );
  }
});

test('status y priority inválidos producen errores de dominio', () => {
  const service = createMocksService(repository());
  assert.throws(() => service.getOrders({ qty: '2', status: 'desconocido' }), error =>
    error.code === 'INVALID_ORDER_STATUS' && error.statusCode === 400
  );
  assert.throws(() => service.getOrders({ qty: '2', priority: 'urgente' }), error =>
    error.code === 'INVALID_ORDER_PRIORITY' && error.statusCode === 400
  );
});

test('filtros válidos producen pedidos sin estados arbitrarios', () => {
  const service = createMocksService(repository());
  const orders = service.getOrders({ qty: '2', status: ORDER_STATUS.DELIVERED, priority: ORDER_PRIORITY.HIGH });
  assert.equal(orders.length, 2);
  assert.ok(orders.every(order => order.status === ORDER_STATUS.DELIVERED));
  assert.ok(orders.every(order => order.priority === ORDER_PRIORITY.HIGH));
});

test('los parámetros desconocidos no se ignoran silenciosamente', async () => {
  const repo = repository();
  const service = createMocksService(repo);
  assert.throws(() => service.getUsers({ qty: '2', extra: 'sí' }), error => error.code === 'INVALID_MOCK_DATA');
  assert.throws(() => service.getBundle({ qty: '2', status: 'pending' }), error => error.code === 'INVALID_MOCK_DATA');
  await assert.rejects(service.seedUsers({ qty: '2', otra: 'cosa' }), error => error.code === 'INVALID_MOCK_DATA');
  assert.equal(repo.calls, 0);
});

test('cuerpo inesperado en la carga se rechaza sin escrituras', async () => {
  const repo = repository();
  const service = createMocksService(repo);
  await assert.rejects(service.seedBundle({ qty: '2' }, { qty: -4 }), error =>
    error.code === 'INVALID_MOCK_DATA' && error.statusCode === 400
  );
  assert.equal(repo.calls, 0);
});

test('un fallo de MongoDB durante la carga se transforma en 503 controlado', async () => {
  const repo = repository();
  repo.insertBundle = async () => { throw new Error('URI y credenciales internas'); };
  repo.insertUsers = async () => { throw new Error('Error de conexión interna'); };
  const service = createMocksService(repo);
  for (const method of ['seedUsers', 'seedBundle']) {
    await assert.rejects(service[method]({ qty: '2' }), error =>
      error.code === 'MOCK_SEED_FAILED' &&
      error.statusCode === 503 &&
      !error.message.includes('interna')
    );
  }
});

test('un fallo de generación responde con una excepción controlada', () => {
  const repo = repository();
  const generators = {
    generateMockUsers: () => { throw new Error('Falló el generador'); },
    generateMockCouriers: () => [],
    generateMockBundle: () => ({ orders: [], deliveries: [], users: [], couriers: [] })
  };
  const service = createMocksService(repo, { generators });
  assert.throws(() => service.getUsers('1'), error =>
    error.code === 'MOCK_GENERATION_FAILED' && error.statusCode === 500
  );
  assert.equal(repo.calls, 0);
});

test('la restricción de entorno sigue bloqueando la carga', async () => {
  const repo = repository();
  const service = createMocksService(repo, { allowSeed: false });
  await assert.rejects(service.seedBundle({ qty: '2' }), error => error.code === 'MOCK_SEED_DISABLED');
  assert.equal(repo.calls, 0);
});
