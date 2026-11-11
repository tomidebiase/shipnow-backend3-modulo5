import test from 'node:test';
import assert from 'node:assert/strict';
import { createMocksService, parseMockQuantity } from '../src/services/mocks.service.js';

const createRepository = () => {
  const calls = [];
  return {
    calls,
    async insertUsers(users) {
      calls.push({ type: 'users', users });
      return users.length;
    },
    async insertBundle(bundle) {
      calls.push({ type: 'bundle', bundle });
      return {
        usuarios: bundle.users.length + bundle.couriers.length,
        repartidores: bundle.couriers.length,
        pedidos: bundle.orders.length,
        entregas: bundle.deliveries.length
      };
    }
  };
};

test('cantidad predeterminada, máximo y valores no permitidos', () => {
  assert.equal(parseMockQuantity(undefined), 10);
  assert.equal(parseMockQuantity('1'), 1);
  assert.equal(parseMockQuantity('100'), 100);
  for (const input of ['0', '-1', '101', '1.5', 'abc', '', ' 2', ['1', '2'], null]) {
    assert.throws(() => parseMockQuantity(input), error => error.statusCode === 400);
  }
});

test('los endpoints GET solo generan datos sin tocar el repositorio', () => {
  const repository = createRepository();
  const service = createMocksService(repository);
  assert.equal(service.getUsers('2').length, 2);
  assert.equal(service.getCouriers('3').length, 3);
  assert.equal(service.getOrders('4').length, 4);
  assert.equal(service.getDeliveries('5').length, 5);
  assert.equal(service.getBundle('6').orders.length, 6);
  assert.equal(repository.calls.length, 0);
});

test('la carga simple inserta exactamente la cantidad solicitada', async () => {
  const repository = createRepository();
  const service = createMocksService(repository);
  assert.deepEqual(await service.seedUsers('10'), { insertados: 10, coleccion: 'usuarios' });
  assert.equal(repository.calls.length, 1);
  assert.equal(repository.calls[0].users.length, 10);
});

test('la carga completa conserva usuarios, pedidos y entregas relacionados', async () => {
  const repository = createRepository();
  const service = createMocksService(repository);
  const response = await service.seedBundle('7');
  assert.equal(response.insertados.pedidos, 7);
  assert.equal(response.insertados.entregas, 7);
  assert.equal(response.insertados.repartidores, 3);
  assert.equal(repository.calls.length, 1);
  assert.equal(repository.calls[0].type, 'bundle');
});

test('en producción se bloquea toda inserción de datos de prueba', async () => {
  const repository = createRepository();
  const service = createMocksService(repository, { allowSeed: false });
  await assert.rejects(service.seedUsers('1'), error => error.statusCode === 403);
  await assert.rejects(service.seedBundle('1'), error => error.statusCode === 403);
  assert.equal(repository.calls.length, 0);
});

test('un qty inválido no llega a MongoDB', async () => {
  const repository = createRepository();
  const service = createMocksService(repository);
  await assert.rejects(service.seedUsers('9999'), error => error.statusCode === 400);
  await assert.rejects(service.seedBundle('0'), error => error.statusCode === 400);
  assert.equal(repository.calls.length, 0);
});

