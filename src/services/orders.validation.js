import { ORDER_STATUS, ORDER_PRIORITY } from '../constants/index.js';
import { InvalidOrderStatusError, InvalidOrderPriorityError } from '../errors/domain-errors.js';

export const assertValidOrderStatus = (status) => {
  if (!Object.values(ORDER_STATUS).includes(status)) throw new InvalidOrderStatusError();
  return status;
};

export const assertValidOrderPriority = (priority) => {
  if (!Object.values(ORDER_PRIORITY).includes(priority)) throw new InvalidOrderPriorityError();
  return priority;
};
