import { InvalidIdError } from '../errors/domain-errors.js';

export const assertValidObjectId = (id) => {
  if (typeof id !== 'string' || !/^[a-fA-F0-9]{24}$/.test(id)) {
    throw new InvalidIdError();
  }
};
