import test from 'node:test';
import assert from 'node:assert/strict';
import { createProductsService } from '../src/services/products.service.js';

const makeRepository = () => ({
  findAll: async (options) => options,
  findById: async () => null,
  create: async (data) => data,
  updateById: async (id, data) => ({ id, ...data }),
  deleteById: async () => null
});

test('un producto con stock queda disponible', async () => {
  const service = createProductsService(makeRepository());
  const product = await service.create({ name: 'Caja', price: 1200, stock: 5 });
  assert.equal(product.status, 'available');
  assert.equal(product.stock, 5);
});

test('un producto sin stock queda agotado', async () => {
  const service = createProductsService(makeRepository());
  const product = await service.create({ name: 'Caja', price: 1200, stock: 0 });
  assert.equal(product.status, 'out_of_stock');
});

test('al modificar el stock se actualiza el estado', async () => {
  const service = createProductsService(makeRepository());
  const product = await service.update('6ae76b2e813a14ee8ae54e42', { stock: 0 });
  assert.equal(product.status, 'out_of_stock');
});

test('un precio negativo es rechazado', async () => {
  const service = createProductsService(makeRepository());
  await assert.rejects(
    () => service.create({ name: 'Caja', price: -1, stock: 1 }),
    { statusCode: 400 }
  );
});

test('el servicio decide si incluye productos agotados', async () => {
  const service = createProductsService(makeRepository());
  assert.deepEqual(await service.getAll({ includeOutOfStock: true }), { includeOutOfStock: true });
});
