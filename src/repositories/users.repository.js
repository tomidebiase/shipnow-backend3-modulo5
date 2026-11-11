import mongoose from 'mongoose';
import UserModel from '../models/user.model.js';

const projection = 'firstName lastName email role createdAt updatedAt';

export const usersRepository = {
  async findAll() {
    return UserModel.find({})
      .select(projection)
      .sort({ createdAt: -1 })
      .lean();
  },

  async findById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return UserModel.findById(id).select(projection).lean();
  },

  async findByEmail(email) {
    return UserModel.findOne({ email }).select('_id email').lean();
  },

  async create(data) {
    const user = await UserModel.create(data);
    return user.toObject();
  },

  async updateById(id, data) {
    if (!mongoose.isValidObjectId(id)) return null;
    return UserModel.findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .select(projection)
      .lean();
  },

  async deleteById(id) {
    if (!mongoose.isValidObjectId(id)) return null;
    return UserModel.findByIdAndDelete(id).select(projection).lean();
  }
};
