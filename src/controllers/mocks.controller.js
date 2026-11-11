import { mocksService } from '../services/mocks.instance.js';

const respond = (method) => async (req, res, next) => {
  try {
    const data = await mocksService[method](req.query);
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const getMockUsers = respond('getUsers');
export const getMockCouriers = respond('getCouriers');
export const getMockOrders = respond('getOrders');
export const getMockDeliveries = respond('getDeliveries');
export const getMockBundle = respond('getBundle');

export const seedMockUsers = async (req, res, next) => {
  try {
    const result = await mocksService.seedUsers(req.query, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const seedMockBundle = async (req, res, next) => {
  try {
    const result = await mocksService.seedBundle(req.query, req.body);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
