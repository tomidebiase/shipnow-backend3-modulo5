import { usersRepository } from '../repositories/users.repository.js';
import { logger } from '../config/logger.js';
import { USER_ROLES } from '../constants/index.js';
import { InvalidInputError, UserNotFoundError, DuplicateEmailError } from '../errors/domain-errors.js';
import { assertValidObjectId } from '../utils/object-id.js';

const allowedFields = ['firstName', 'lastName', 'email'];
const hasField = (data, key) => Object.prototype.hasOwnProperty.call(data, key);

const normalizeUser = (input, partial = false) => {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new InvalidInputError( 'Los datos del usuario son inválidos');
  }

  const unknownFields = Object.keys(input).filter((key) => !allowedFields.includes(key));
  if (unknownFields.length > 0) {
    throw new InvalidInputError( `Campos no permitidos: ${unknownFields.join(', ')}`);
  }

  const result = {};

  for (const field of ['firstName', 'lastName']) {
    if (!partial || hasField(input, field)) {
      if (typeof input[field] !== 'string' || !input[field].trim()) {
        throw new InvalidInputError( `El campo ${field} es obligatorio`);
      }
      result[field] = input[field].trim();
    }
  }

  if (!partial || hasField(input, 'email')) {
    if (typeof input.email !== 'string') {
      throw new InvalidInputError( 'El correo electrónico es obligatorio');
    }
    const email = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new InvalidInputError( 'El correo electrónico es inválido');
    }
    result.email = email;
  }

  if (partial && Object.keys(result).length === 0) {
    throw new InvalidInputError( 'No se enviaron campos para actualizar');
  }

  return result;
};

export const createUsersService = (repository) => ({
  async getAll() {
    return repository.findAll();
  },

  async getById(id) {
    assertValidObjectId(id);
    const user = await repository.findById(id);
    if (!user) throw new UserNotFoundError();
    return user;
  },

  async create(data) {
    const userData = normalizeUser(data);
    const existing = await repository.findByEmail(userData.email);
    if (existing) throw new DuplicateEmailError();
    const user = await repository.create({ ...userData, role: USER_ROLES.USER });
    logger.info('Usuario creado', { userId: user?._id?.toString() ?? null });
    return user;
  },

  async update(id, data) {
    assertValidObjectId(id);
    const updated = await repository.updateById(id, normalizeUser(data, true));
    if (!updated) throw new UserNotFoundError();
    return updated;
  },

  async remove(id) {
    assertValidObjectId(id);
    const deleted = await repository.deleteById(id);
    if (!deleted) throw new UserNotFoundError();
  }
});

export const usersService = createUsersService(usersRepository);
