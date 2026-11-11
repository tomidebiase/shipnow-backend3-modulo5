import { productsRepository } from '../repositories/products.repository.js';
import { logger } from '../config/logger.js';
import { PRODUCT_STATUS } from '../constants/index.js';
import { InvalidInputError, ProductNotFoundError } from '../errors/domain-errors.js';
import { assertValidObjectId } from '../utils/object-id.js';

const allowedFields = ['name', 'description', 'price', 'stock'];
const hasField = (data, key) => Object.prototype.hasOwnProperty.call(data, key);

const normalizeProduct = (input, partial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidInputError( 'Los datos del producto son inválidos');
  }

  const unknownFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new InvalidInputError( `Campos no permitidos: ${unknownFields.join(', ')}`);
  }

  const result = {};

  if (!partial || hasField(input, 'name')) {
    if (typeof input.name !== 'string' || !input.name.trim()) {
      throw new InvalidInputError( 'El nombre del producto es obligatorio');
    }
    result.name = input.name.trim();
  }

  if (!partial || hasField(input, 'description')) {
    if (hasField(input, 'description') && typeof input.description !== 'string') {
      throw new InvalidInputError( 'La descripción debe ser un texto');
    }
    result.description = (input.description ?? '').trim();
  }

  if (!partial || hasField(input, 'price')) {
    if (typeof input.price !== 'number' || !Number.isFinite(input.price) || input.price < 0) {
      throw new InvalidInputError( 'El precio debe ser un número mayor o igual a cero');
    }
    result.price = input.price;
  }

  if (!partial || hasField(input, 'stock')) {
    const stock = input.stock ?? (partial ? undefined : 0);
    if (!Number.isInteger(stock) || stock < 0) {
      throw new InvalidInputError( 'El stock debe ser un número entero mayor o igual a cero');
    }
    result.stock = stock;
    result.status = stock > 0 ? PRODUCT_STATUS.AVAILABLE : PRODUCT_STATUS.OUT_OF_STOCK;
  }

  if (partial && Object.keys(result).length === 0) {
    throw new InvalidInputError( 'No se enviaron campos para actualizar');
  }

  return result;
};

export const createProductsService = (repository) => ({
  async getAll({ includeOutOfStock = false } = {}) {
    return repository.findAll({ includeOutOfStock });
  },

  async getById(id) {
    assertValidObjectId(id);
    const product = await repository.findById(id);
    if (!product) throw new ProductNotFoundError();
    return product;
  },

  async create(data) {
    const product = await repository.create(normalizeProduct(data));
    logger.info('Producto creado', { productId: product?._id?.toString() ?? null });
    return product;
  },

  async update(id, data) {
    assertValidObjectId(id);
    const updated = await repository.updateById(id, normalizeProduct(data, true));
    if (!updated) throw new ProductNotFoundError();
    return updated;
  },

  async remove(id) {
    assertValidObjectId(id);
    const deleted = await repository.deleteById(id);
    if (!deleted) throw new ProductNotFoundError();
  }
});

export const productsService = createProductsService(productsRepository);
