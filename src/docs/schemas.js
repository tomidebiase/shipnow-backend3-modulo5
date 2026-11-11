import {
  USER_ROLES,
  ORDER_STATUS,
  ORDER_PRIORITY,
  DELIVERY_STATUS,
  PRODUCT_STATUS
} from '../constants/index.js';

const objectId = {
  type: 'string',
  pattern: '^[0-9a-fA-F]{24}$',
  example: '507f1f77bcf86cd799439011'
};

const field = (description, type = 'string') => ({ type, description });

export const schemas = {
  Usuario: {
    type: 'object',
    required: ['_id', 'firstName', 'lastName', 'email', 'role'],
    properties: {
      _id: objectId,
      firstName: field('Nombre del usuario'),
      lastName: field('Apellido del usuario'),
      email: { type: 'string', format: 'email' },
      role: { type: 'string', enum: Object.values(USER_ROLES) },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  UsuarioCrear: {
    type: 'object',
    additionalProperties: false,
    required: ['firstName', 'lastName', 'email'],
    properties: {
      firstName: { type: 'string', minLength: 1, example: 'Ana' },
      lastName: { type: 'string', minLength: 1, example: 'Pérez' },
      email: { type: 'string', format: 'email', example: 'ana@example.com' }
    }
  },
  UsuarioActualizar: {
    type: 'object',
    additionalProperties: false,
    minProperties: 1,
    properties: {
      firstName: { type: 'string', minLength: 1 },
      lastName: { type: 'string', minLength: 1 },
      email: { type: 'string', format: 'email' }
    }
  },
  Pedido: {
    type: 'object',
    required: ['_id', 'user', 'description', 'deliveryAddress', 'totalAmount', 'status', 'priority'],
    properties: {
      _id: objectId,
      user: { ...objectId, description: 'ID del usuario propietario del pedido' },
      description: field('Descripción del pedido'),
      deliveryAddress: field('Dirección de entrega'),
      totalAmount: { type: 'number', minimum: 0 },
      status: { type: 'string', enum: Object.values(ORDER_STATUS) },
      priority: { type: 'string', enum: Object.values(ORDER_PRIORITY) },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  Entrega: {
    type: 'object',
    required: ['_id', 'order', 'status', 'trackingCode'],
    properties: {
      _id: objectId,
      order: { ...objectId, description: 'ID del pedido asociado' },
      courier: {
        type: 'string',
        nullable: true,
        pattern: objectId.pattern,
        description: 'ID de repartidor o null cuando la entrega está pendiente'
      },
      status: { type: 'string', enum: Object.values(DELIVERY_STATUS) },
      trackingCode: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  ItemPedido: {
    type: 'object',
    description: 'Schema de referencia para una ampliación futura. El modelo actual de Pedido no contiene items.',
    required: ['product', 'quantity', 'unitPrice'],
    properties: {
      product: objectId,
      quantity: { type: 'integer', minimum: 1 },
      unitPrice: { type: 'number', minimum: 0 }
    }
  },
  Producto: {
    type: 'object',
    required: ['_id', 'name', 'price', 'stock', 'status'],
    properties: {
      _id: objectId,
      name: { type: 'string' },
      description: { type: 'string', default: '' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 },
      status: { type: 'string', enum: Object.values(PRODUCT_STATUS) },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' }
    }
  },
  ProductoCrear: {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'price'],
    properties: {
      name: { type: 'string', minLength: 1, example: 'Caja de cartón' },
      description: { type: 'string', example: 'Caja mediana' },
      price: { type: 'number', minimum: 0, example: 1500 },
      stock: { type: 'integer', minimum: 0, default: 0, example: 5 }
    }
  },
  ProductoActualizar: {
    type: 'object',
    minProperties: 1,
    additionalProperties: false,
    properties: {
      name: { type: 'string', minLength: 1 },
      description: { type: 'string' },
      price: { type: 'number', minimum: 0 },
      stock: { type: 'integer', minimum: 0 }
    }
  },
  Error: {
    type: 'object',
    required: ['status', 'error'],
    properties: {
      status: { type: 'string', enum: ['error'] },
      error: {
        type: 'object',
        required: ['code', 'message'],
        properties: {
          code: { type: 'string', example: 'INVALID_MOCK_QUANTITY' },
          message: { type: 'string', example: 'qty debe ser un número entero positivo' }
        }
      }
    }
  },
  RespuestaExitosa: {
    type: 'object',
    required: ['status', 'payload'],
    properties: {
      status: { type: 'string', enum: ['success'] },
      payload: { description: 'Recurso o colección devuelta por el controlador' }
    }
  },
  MockBundle: {
    type: 'object',
    required: ['users', 'couriers', 'orders', 'deliveries'],
    properties: {
      users: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } },
      couriers: { type: 'array', items: { $ref: '#/components/schemas/Usuario' } },
      orders: { type: 'array', items: { $ref: '#/components/schemas/Pedido' } },
      deliveries: { type: 'array', items: { $ref: '#/components/schemas/Entrega' } }
    }
  },
  MockSeedUsers: {
    type: 'object',
    required: ['insertados', 'coleccion'],
    properties: {
      insertados: { type: 'integer', minimum: 1, example: 10 },
      coleccion: { type: 'string', enum: ['usuarios'] }
    }
  },
  MockSeedBundle: {
    type: 'object',
    required: ['insertados', 'colecciones'],
    properties: {
      insertados: {
        type: 'object',
        required: ['usuarios', 'repartidores', 'pedidos', 'entregas'],
        properties: {
          usuarios: { type: 'integer', example: 14 },
          repartidores: { type: 'integer', example: 4 },
          pedidos: { type: 'integer', example: 10 },
          entregas: { type: 'integer', example: 10 }
        }
      },
      colecciones: {
        type: 'array',
        items: { type: 'string' },
        example: ['usuarios', 'pedidos', 'entregas']
      }
    }
  },
  LoggerTest: {
    type: 'object',
    required: ['status', 'levels', 'message'],
    properties: {
      status: { type: 'string', enum: ['success'] },
      levels: {
        type: 'array',
        items: { type: 'string', enum: ['debug', 'http', 'info', 'warning', 'error', 'fatal'] },
        example: ['debug', 'http', 'info', 'warning', 'error', 'fatal']
      },
      message: { type: 'string', example: 'Eventos de prueba registrados' }
    }
  }
};
