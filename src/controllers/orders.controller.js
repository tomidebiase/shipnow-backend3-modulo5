import { ordersService } from '../services/orders.service.js';

export const getOrderById = async (req, res, next) => {
  try {
    const order = await ordersService.getById(req.params.id);
    res.status(200).json({ status: 'success', payload: order });
  } catch (error) {
    next(error);
  }
};
