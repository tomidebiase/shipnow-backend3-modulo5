import { deliveriesService } from '../services/deliveries.service.js';

export const getDeliveryById = async (req, res, next) => {
  try {
    const delivery = await deliveriesService.getById(req.params.id);
    res.status(200).json({ status: 'success', payload: delivery });
  } catch (error) {
    next(error);
  }
};
