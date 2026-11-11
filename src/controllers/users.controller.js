import { usersService } from '../services/users.service.js';

export const getUsers = async (req, res, next) => {
  try {
    const users = await usersService.getAll();
    res.status(200).json({ status: 'success', payload: users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await usersService.getById(req.params.id);
    res.status(200).json({ status: 'success', payload: user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const user = await usersService.create(req.body);
    res.status(201).json({ status: 'success', payload: user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await usersService.update(req.params.id, req.body);
    res.status(200).json({ status: 'success', payload: user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    await usersService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
