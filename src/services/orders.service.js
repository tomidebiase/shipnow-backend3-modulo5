import { ordersRepository } from '../repositories/orders.repository.js';
import { logger } from '../config/logger.js';
import { assertValidObjectId } from '../utils/object-id.js';
import { OrderNotFoundError } from '../errors/domain-errors.js';
export { assertValidOrderStatus, assertValidOrderPriority } from './orders.validation.js';

export const createOrdersService = (repository) => ({
  async getById(id) {
    assertValidObjectId(id);
    const order = await repository.findById(id);
    if (!order) {
      logger.warning('Pedido no encontrado', { orderId: id });
      throw new OrderNotFoundError();
    }
    return order;
  }
});

export const ordersService = createOrdersService(ordersRepository);
