import { productsService } from '../services/products.service.js';

export const getProducts = async (req, res, next) => {
  try {
    const includeOutOfStock = req.query.includeOutOfStock === 'true';
    const products = await productsService.getAll({ includeOutOfStock });
    res.status(200).json({ status: 'success', payload: products });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const product = await productsService.getById(req.params.id);
    res.status(200).json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req, res, next) => {
  try {
    const product = await productsService.create(req.body);
    res.status(201).json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await productsService.update(req.params.id, req.body);
    res.status(200).json({ status: 'success', payload: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    await productsService.remove(req.params.id);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};
