import { randomBytes } from 'node:crypto';
import { USER_ROLES, ORDER_STATUS, ORDER_PRIORITY, DELIVERY_STATUS } from '../constants/index.js';

const firstNames = ['Ana', 'Luis', 'Sofía', 'Martín', 'Camila', 'Diego', 'Lucía', 'Pedro'];
const lastNames = ['Pérez', 'Gómez', 'Ruiz', 'Torres', 'López', 'Díaz', 'Molina', 'Sosa'];
const streets = ['San Martín', 'Belgrano', 'Mitre', 'Rivadavia', 'Sarmiento'];
const priorityValues = Object.values(ORDER_PRIORITY);
const deliveryValues = Object.values(DELIVERY_STATUS);

const newId = () => randomBytes(12).toString('hex');
const newToken = () => randomBytes(6).toString('hex');

const generatePerson = (index, role, token) => {
  const firstName = firstNames[index % firstNames.length];
  const lastName = lastNames[index % lastNames.length];
  return {
    _id: newId(),
    firstName,
    lastName,
    email: `prueba.${token}.${index}@example.test`,
    role
  };
};

export const generateMockUsers = (qty) => {
  const token = newToken();
  return Array.from({ length: qty }, (_, index) =>
    generatePerson(index, index % 2 === 0 ? USER_ROLES.USER : USER_ROLES.COURIER, token)
  );
};

export const generateMockCouriers = (qty) => {
  const token = newToken();
  return Array.from({ length: qty }, (_, index) =>
    generatePerson(index, USER_ROLES.COURIER, token)
  );
};

const statusForDelivery = (status) => {
  switch (status) {
    case DELIVERY_STATUS.PENDING:
      return ORDER_STATUS.PENDING;
    case DELIVERY_STATUS.ASSIGNED:
      return ORDER_STATUS.CONFIRMED;
    case DELIVERY_STATUS.IN_TRANSIT:
      return ORDER_STATUS.IN_TRANSIT;
    case DELIVERY_STATUS.DELIVERED:
      return ORDER_STATUS.DELIVERED;
    case DELIVERY_STATUS.FAILED:
      return ORDER_STATUS.CANCELLED;
    default:
      return ORDER_STATUS.PENDING;
  }
};

export const generateMockBundle = (qty) => {
  const token = newToken();
  const customers = Array.from({ length: qty }, (_, index) =>
    generatePerson(index, USER_ROLES.USER, token)
  );
  const couriers = Array.from({ length: Math.max(1, Math.ceil(qty / 3)) }, (_, index) =>
    generatePerson(qty + index, USER_ROLES.COURIER, token)
  );
  const orders = [];
  const deliveries = [];

  for (let index = 0; index < qty; index += 1) {
    const deliveryStatus = deliveryValues[index % deliveryValues.length];
    const orderId = newId();
    const order = {
      _id: orderId,
      user: customers[index]._id,
      description: `Pedido de prueba ${index + 1}`,
      deliveryAddress: `${streets[index % streets.length]} ${100 + index}`,
      totalAmount: 1500 + index * 125,
      status: statusForDelivery(deliveryStatus),
      priority: priorityValues[index % priorityValues.length]
    };
    const delivery = {
      _id: newId(),
      order: orderId,
      courier: deliveryStatus === DELIVERY_STATUS.PENDING
        ? null
        : couriers[index % couriers.length]._id,
      status: deliveryStatus,
      trackingCode: `SN-${token.toUpperCase()}-${index + 1}`
    };
    orders.push(order);
    deliveries.push(delivery);
  }
  return { users: customers, couriers, orders, deliveries };
};

