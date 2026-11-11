import { ERROR_DICTIONARY } from './error-dictionary.js';

export class DomainError extends Error {
  constructor(code, message, { cause } = {}) {
    const definition = ERROR_DICTIONARY[code];
    if (!definition) {
      throw new TypeError(`Código de error no registrado: ${code}`);
    }
    super(message ?? definition.message, { cause });
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = definition.statusCode;
  }
}

export class InvalidInputError extends DomainError {
  constructor(message) { super('INVALID_INPUT', message); }
}

export class InvalidIdError extends DomainError {
  constructor() { super('INVALID_ID'); }
}

export class UserNotFoundError extends DomainError {
  constructor() { super('USER_NOT_FOUND'); }
}

export class ProductNotFoundError extends DomainError {
  constructor() { super('PRODUCT_NOT_FOUND'); }
}

export class OrderNotFoundError extends DomainError {
  constructor() { super('ORDER_NOT_FOUND'); }
}

export class DeliveryNotFoundError extends DomainError {
  constructor() { super('DELIVERY_NOT_FOUND'); }
}

export class InvalidOrderStatusError extends DomainError {
  constructor() { super('INVALID_ORDER_STATUS'); }
}

export class InvalidOrderPriorityError extends DomainError {
  constructor() { super('INVALID_ORDER_PRIORITY'); }
}

export class InvalidMockQuantityError extends DomainError {
  constructor(message) { super('INVALID_MOCK_QUANTITY', message); }
}

export class InvalidMockDataError extends DomainError {
  constructor(message) { super('INVALID_MOCK_DATA', message); }
}

export class DuplicateEmailError extends DomainError {
  constructor() { super('DUPLICATE_EMAIL'); }
}

export class MockSeedDisabledError extends DomainError {
  constructor() { super('MOCK_SEED_DISABLED'); }
}

export class MockSeedError extends DomainError {
  constructor(cause) { super('MOCK_SEED_FAILED', undefined, { cause }); }
}

export class MockGenerationError extends DomainError {
  constructor(cause) { super('MOCK_GENERATION_FAILED', undefined, { cause }); }
}

export class RouteNotFoundError extends DomainError {
  constructor() { super('ROUTE_NOT_FOUND'); }
}
