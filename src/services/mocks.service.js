import { logger } from '../config/logger.js';
import {
  DomainError,
  InvalidMockQuantityError,
  InvalidMockDataError,
  MockSeedDisabledError,
  MockSeedError,
  MockGenerationError
} from '../errors/domain-errors.js';
import { assertValidOrderStatus, assertValidOrderPriority } from './orders.validation.js';
import {
  generateMockUsers,
  generateMockCouriers,
  generateMockBundle
} from './mocks.generator.js';

const MAX_QTY = 100;
const DEFAULT_QTY = 10;

export const parseMockQuantity = (value) => {
  if (value === undefined) return DEFAULT_QTY;
  if (typeof value !== 'string' || !/^[1-9][0-9]*$/.test(value)) {
    throw new InvalidMockQuantityError('qty debe ser un número entero positivo');
  }
  const qty = Number(value);
  if (!Number.isSafeInteger(qty) || qty > MAX_QTY) {
    throw new InvalidMockQuantityError(`qty debe estar entre 1 y ${MAX_QTY}`);
  }
  return qty;
};

const parseMockOptions = (value, { orderFilters = false } = {}) => {
  if (value === undefined || typeof value === 'string') {
    return { qty: parseMockQuantity(value) };
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new InvalidMockDataError();
  }

  const allowedKeys = orderFilters ? ['qty', 'status', 'priority'] : ['qty'];
  const extra = Object.keys(value).filter(key => !allowedKeys.includes(key));
  if (extra.length) {
    throw new InvalidMockDataError(`Parámetros no permitidos: ${extra.join(', ')}`);
  }

  const qty = parseMockQuantity(value.qty);
  const options = { qty };
  if (orderFilters && value.status !== undefined) {
    options.status = assertValidOrderStatus(value.status);
  }
  if (orderFilters && value.priority !== undefined) {
    options.priority = assertValidOrderPriority(value.priority);
  }
  return options;
};

const assertEmptySeedBody = (body) => {
  if (body === undefined) return;
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length > 0) {
    throw new InvalidMockDataError('La carga de datos recibe únicamente el parámetro qty en la URL');
  }
};

const generateOrThrow = (generator) => {
  try {
    return generator();
  } catch (error) {
    if (error instanceof DomainError) throw error;
    throw new MockGenerationError(error);
  }
};

export const createMocksService = (repository, {
  allowSeed = true,
  generators = { generateMockUsers, generateMockCouriers, generateMockBundle }
} = {}) => ({
  getUsers(value) {
    const { qty } = parseMockOptions(value);
    const users = generateOrThrow(() => generators.generateMockUsers(qty));
    logger.info('Usuarios de prueba generados', { qty });
    return users;
  },
  getCouriers(value) {
    const { qty } = parseMockOptions(value);
    const couriers = generateOrThrow(() => generators.generateMockCouriers(qty));
    logger.info('Repartidores de prueba generados', { qty });
    return couriers;
  },
  getBundle(value) {
    const { qty } = parseMockOptions(value);
    const bundle = generateOrThrow(() => generators.generateMockBundle(qty));
    logger.info('Conjunto de prueba generado', { qty, orders: bundle.orders.length });
    return bundle;
  },
  getOrders(value) {
    const { qty, status, priority } = parseMockOptions(value, { orderFilters: true });
    const orders = generateOrThrow(() => generators.generateMockBundle(qty).orders);
    if (status !== undefined) orders.forEach(order => { order.status = status; });
    if (priority !== undefined) orders.forEach(order => { order.priority = priority; });
    logger.info('Pedidos de prueba generados', { qty });
    return orders;
  },
  getDeliveries(value) {
    const { qty } = parseMockOptions(value);
    const deliveries = generateOrThrow(() => generators.generateMockBundle(qty).deliveries);
    logger.info('Entregas de prueba generadas', { qty });
    return deliveries;
  },
  async seedUsers(value, body) {
    if (!allowSeed) throw new MockSeedDisabledError();
    assertEmptySeedBody(body);
    const { qty } = parseMockOptions(value);
    const users = generateOrThrow(() => generators.generateMockUsers(qty));
    try {
      const inserted = await repository.insertUsers(users);
      logger.info('Usuarios de prueba insertados', { qty, inserted });
      return { insertados: inserted, coleccion: 'usuarios' };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new MockSeedError(error);
    }
  },
  async seedBundle(value, body) {
    if (!allowSeed) throw new MockSeedDisabledError();
    assertEmptySeedBody(body);
    const { qty } = parseMockOptions(value);
    const bundle = generateOrThrow(() => generators.generateMockBundle(qty));
    try {
      const totals = await repository.insertBundle(bundle);
      logger.info('Carga de prueba completada', { qty, orders: totals.pedidos, deliveries: totals.entregas });
      return { insertados: totals, colecciones: ['usuarios', 'pedidos', 'entregas'] };
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw new MockSeedError(error);
    }
  }
});
