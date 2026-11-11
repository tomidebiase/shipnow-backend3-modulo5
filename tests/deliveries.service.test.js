import test from 'node:test';
import assert from 'node:assert/strict';
import { createDeliveriesService } from '../src/services/deliveries.service.js';

const validId = '507f1f77bcf86cd799439011';

test('una entrega existente responde con los datos del repositorio', async () => {
  const delivery = { _id: validId, status: 'pending', courier: null };
  const service = createDeliveriesService({ findById: async id => id === validId ? delivery : null });
  assert.deepEqual(await service.getById(validId), delivery);
});

test('una entrega inexistente genera un error de dominio 404', async () => {
  const service = createDeliveriesService({ findById: async () => null });
  await assert.rejects(service.getById(validId), error =>
    error.code === 'DELIVERY_NOT_FOUND' && error.statusCode === 404
  );
});

test('un identificador de entrega inválido se rechaza antes de consultar', async () => {
  let invoked = false;
  const service = createDeliveriesService({ findById: async () => { invoked = true; return null; } });
  await assert.rejects(service.getById('incorrecto'), error => error.code === 'INVALID_ID');
  assert.equal(invoked, false);
});
