import DeliveryModel from '../models/delivery.model.js';

export const deliveriesRepository = {
  findById(id) {
    return DeliveryModel.findById(id).lean();
  }
};
