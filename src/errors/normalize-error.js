import { DomainError } from './domain-errors.js';

export const normalizeError = (error) => {
  if (error instanceof DomainError) return error;

  if (error?.type === 'entity.parse.failed') {
    return new DomainError('INVALID_JSON');
  }

  if (error?.type === 'entity.too.large' || error?.status === 413) {
    return new DomainError('PAYLOAD_TOO_LARGE');
  }

  if (error?.code === 11000) {
    return new DomainError('DUPLICATE_RECORD');
  }

  if (error?.name === 'ValidationError' || error?.name === 'CastError') {
    return new DomainError('INVALID_INPUT');
  }

  if (/^(?:Mongo|MongooseServerSelectionError|MongooseError)/.test(error?.name ?? '')) {
    return new DomainError('DATABASE_UNAVAILABLE');
  }

  return new DomainError('INTERNAL_ERROR');
};
