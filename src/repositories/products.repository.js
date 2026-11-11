import mongoose from 'mongoose';
import ProductModel from '../models/product.model.js';
import { PRODUCT_STATUS } from '../constants/index.js';

const projection = 'name description price stock status createdAt updatedAt';

export const productsRepository = {
  async findAll({ includeOutOfStock = false } = {}) {
    const filter = includeOutOfStock
      ? {}
      : { status: PRODUCT_STATUS.AVAILABLE, stock: { $gt: 0 } };

    return ProductModel.find(filter)
      .select(projection)
      .sort({ createdAt: -1 })
      .lean();
  },

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ProductModel.findById(id).select(projection).lean();
  },

  async create(data) {
    const product = await ProductModel.create(data);
    return product.toObject();
  },

  async updateById(id, data) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ProductModel.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(projection)
      .lean();
  },

  async deleteById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return ProductModel.findByIdAndDelete(id).select(projection).lean();
  }
};
