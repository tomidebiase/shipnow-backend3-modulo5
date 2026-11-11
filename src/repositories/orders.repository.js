import OrderModel from '../models/order.model.js';

export const ordersRepository = {
  findById(id) {
    return OrderModel.findById(id).lean();
  }
};
