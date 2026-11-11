import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateMockUsers,
  generateMockCouriers,
  generateMockBundle
} from '../src/services/mocks.generator.js';
import { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS } from '../src/constants/index.js';

const validId = (value) => typeof value === 'string' && /^[a-f0-9]{24}$/.test(value);

test('los usuarios simulados respetan los roles y el esquema existente', () => {
  const users = generateMockUsers(10);
  assert.equal(users.length, 10);
  assert.ok(users.some(user => user.role === USER_ROLES.COURIER));

  for (const user of users) {
    assert.ok(Object.values(USER_ROLES).includes(user.role));
    assert.ok(validId(user._id));
    assert.ok(user.firstName.length > 0);
    assert.ok(user.lastName.length > 0);
    assert.match(user.email, /^prueba\..+@example\.test$/);
  }
  assert.equal(new Set(users.map(user => user.email)).size, 10);
});

test('los repartidores generados tienen siempre el rol correcto', () => {
  const couriers = generateMockCouriers(5);
  assert.equal(couriers.length, 5);
  assert.ok(couriers.every(courier => courier.role === USER_ROLES.COURIER));
});

test('el paquete mantiene las relaciones entre usuarios, pedidos y entregas', () => {
  const bundle = generateMockBundle(20);
  assert.equal(bundle.users.length, 20);
  assert.equal(bundle.orders.length, 20);
  assert.equal(bundle.deliveries.length, 20);
  assert.ok(bundle.couriers.length > 0);

  const customers = new Set(bundle.users.map(user => user._id));
  const courierIds = new Set(bundle.couriers.map(courier => courier._id));
  const orderIds = new Set(bundle.orders.map(order => order._id));

  assert.ok(bundle.users.every(user => user.role === USER_ROLES.USER));
  assert.ok(bundle.couriers.every(user => user.role === USER_ROLES.COURIER));
  assert.ok(bundle.orders.every(order => customers.has(order.user)));
  assert.ok(bundle.orders.every(order => Object.values(ORDER_STATUS).includes(order.status)));
  assert.ok(bundle.orders.every(order => Object.values(ORDER_PRIORITY).includes(order.priority)));
  assert.ok(bundle.deliveries.every(delivery => orderIds.has(delivery.order)));
  assert.ok(bundle.deliveries.every(delivery => Object.values(DELIVERY_STATUS).includes(delivery.status)));
  assert.equal(new Set(bundle.deliveries.map(delivery => delivery.order)).size, 20);

  const expectedStatus = {
    [DELIVERY_STATUS.PENDING]: ORDER_STATUS.PENDING,
    [DELIVERY_STATUS.ASSIGNED]: ORDER_STATUS.CONFIRMED,
    [DELIVERY_STATUS.IN_TRANSIT]: ORDER_STATUS.IN_TRANSIT,
    [DELIVERY_STATUS.DELIVERED]: ORDER_STATUS.DELIVERED,
    [DELIVERY_STATUS.FAILED]: ORDER_STATUS.CANCELLED
  };

  for (const delivery of bundle.deliveries) {
    const order = bundle.orders.find(item => item._id === delivery.order);
    assert.equal(order.status, expectedStatus[delivery.status]);
    if (delivery.status === DELIVERY_STATUS.PENDING) {
      assert.equal(delivery.courier, null);
    } else {
      assert.ok(courierIds.has(delivery.courier));
    }
  }
});

test('los tokens evitan correos repetidos entre tandas', () => {
  const a = generateMockUsers(10);
  const b = generateMockUsers(10);
  assert.equal(new Set([...a, ...b].map(user => user.email)).size, 20);
});

test('el paquete de una sola entrega conserva las referencias', () => {
  const bundle = generateMockBundle(1);
  assert.equal(bundle.users.length, 1);
  assert.equal(bundle.couriers.length, 1);
  assert.equal(bundle.orders[0].user, bundle.users[0]._id);
  assert.equal(bundle.deliveries[0].order, bundle.orders[0]._id);
});

