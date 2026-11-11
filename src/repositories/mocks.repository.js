import UserModel from '../models/user.model.js';
import OrderModel from '../models/order.model.js';
import DeliveryModel from '../models/delivery.model.js';

export const mocksRepository = {
  async insertUsers(users) {
    try {
      const created = await UserModel.insertMany(users, { ordered: true });
      return created.length;
    } catch (error) {
      try {
        await UserModel.deleteMany({ _id: { $in: users.map(item => item._id) } });
      } catch (cleanupError) {
        console.error('No se pudo revertir la carga de usuarios:', cleanupError);
      }
      throw error;
    }
  },

  async insertBundle({ users, couriers, orders, deliveries }) {
    const allUsers = [...users, ...couriers];

    try {
      await UserModel.insertMany(allUsers, { ordered: true });
      await OrderModel.insertMany(orders, { ordered: true });
      await DeliveryModel.insertMany(deliveries, { ordered: true });
    } catch (error) {
      try {
        await Promise.all([
          DeliveryModel.deleteMany({ _id: { $in: deliveries.map(item => item._id) } }),
          OrderModel.deleteMany({ _id: { $in: orders.map(item => item._id) } }),
          UserModel.deleteMany({ _id: { $in: allUsers.map(item => item._id) } })
        ]);
      } catch (cleanupError) {
        console.error('No se pudo revertir toda la carga de prueba:', cleanupError);
      }
      throw error;
    }

    return {
      usuarios: allUsers.length,
      repartidores: couriers.length,
      pedidos: orders.length,
      entregas: deliveries.length
    };
  }
};
