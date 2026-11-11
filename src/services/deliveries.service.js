import { deliveriesRepository } from '../repositories/deliveries.repository.js';
import { assertValidObjectId } from '../utils/object-id.js';
import { DeliveryNotFoundError } from '../errors/domain-errors.js';

export const createDeliveriesService = (repository) => ({
  async getById(id) {
    assertValidObjectId(id);
    const delivery = await repository.findById(id);
    if (!delivery) throw new DeliveryNotFoundError();
    return delivery;
  }
});

export const deliveriesService = createDeliveriesService(deliveriesRepository);
