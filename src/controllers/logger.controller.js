import { testLogger } from '../services/logger.service.js';

export const testLoggerController = (req, res, next) => {
  try {
    res.status(200).json(testLogger());
  } catch (error) {
    next(error);
  }
};
