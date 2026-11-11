import test from 'node:test';
import assert from 'node:assert/strict';
import { createUsersService } from '../src/services/users.service.js';

const makeRepository = () => ({
  findAll: async () => [],
  findById: async () => null,
  findByEmail: async () => null,
  create: async (data) => data,
  updateById: async (id, data) => ({ id, ...data }),
  deleteById: async () => null
});

test('el usuario se crea con rol USER', async () => {
  const service = createUsersService(makeRepository());
  const user = await service.create({ firstName: 'Ana', lastName: 'García', email: 'ANA@MAIL.COM' });
  assert.equal(user.role, 'user');
  assert.equal(user.email, 'ana@mail.com');
});

test('no se admite asignar ADMIN desde la petición', async () => {
  const service = createUsersService(makeRepository());
  await assert.rejects(
    () => service.create({ firstName: 'Ana', lastName: 'García', email: 'ana@mail.com', role: 'admin' }),
    { statusCode: 400 }
  );
});

test('se rechaza un correo duplicado', async () => {
  const repository = makeRepository();
  repository.findByEmail = async () => ({ email: 'ana@mail.com' });
  const service = createUsersService(repository);
  await assert.rejects(
    () => service.create({ firstName: 'Ana', lastName: 'García', email: 'ana@mail.com' }),
    { statusCode: 409 }
  );
});
