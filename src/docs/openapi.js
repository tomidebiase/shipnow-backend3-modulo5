import {
  ORDER_STATUS,
  ORDER_PRIORITY
} from '../constants/index.js';
import { schemas } from './schemas.js';

const ref = (name) => ({ $ref: `#/components/schemas/${name}` });
const json = (schema) => ({
  'application/json': { schema }
});
const success = (payload) => ({
  allOf: [
    ref('RespuestaExitosa'),
    { type: 'object', properties: { payload } }
  ]
});
const response = (description, schema) => ({
  description,
  ...(schema ? { content: json(schema) } : {})
});
const error = (description) => response(description, ref('Error'));
const commonErrors = {
  '500': error('INTERNAL_ERROR: error inesperado del servidor'),
  '503': error('DATABASE_UNAVAILABLE: base de datos no disponible')
};
const pathId = {
  name: 'id',
  in: 'path',
  required: true,
  description: 'Identificador ObjectId de MongoDB (24 caracteres hexadecimales)',
  schema: { type: 'string', pattern: '^[a-fA-F0-9]{24}$' }
};
const qty = {
  name: 'qty',
  in: 'query',
  required: false,
  description: 'Cantidad de datos simulados; de 1 a 100, predeterminada en 10. Valores incorrectos generan INVALID_MOCK_QUANTITY.',
  schema: { type: 'integer', minimum: 1, maximum: 100, default: 10 }
};
const emptyBody = {
  required: false,
  description: 'No se requiere body. Se admite JSON vacío {}, pero se rechazan campos adicionales (INVALID_MOCK_DATA).',
  content: json({ type: 'object', maxProperties: 0, additionalProperties: false })
};
const body = (schema, description) => ({
  required: true,
  description,
  content: json(ref(schema))
});
const list = (name) => ({ type: 'array', items: ref(name) });

const userReadErrors = {
  '400': error('INVALID_ID: identificador mal formado'),
  '404': error('USER_NOT_FOUND: usuario inexistente'),
  ...commonErrors
};
const productReadErrors = {
  '400': error('INVALID_ID: identificador mal formado'),
  '404': error('PRODUCT_NOT_FOUND: producto inexistente'),
  ...commonErrors
};
const userCreateErrors = {
  '400': error('INVALID_INPUT: datos o campos inválidos; INVALID_JSON: JSON malformado'),
  '409': error('DUPLICATE_EMAIL o DUPLICATE_RECORD: correo electrónico duplicado'),
  ...commonErrors
};
const productInputErrors = {
  '400': error('INVALID_INPUT: datos o campos inválidos; INVALID_JSON: JSON malformado'),
  ...commonErrors
};

const mockRead = (tag, description, schema, options = {}) => ({
  tags: ['Mocks'],
  summary: tag,
  description,
  parameters: [
    qty,
    ...(options.filters ? [
      { name: 'status', in: 'query', required: false, description: 'Estado del pedido definido en ORDER_STATUS', schema: { type: 'string', enum: Object.values(ORDER_STATUS) } },
      { name: 'priority', in: 'query', required: false, description: 'Prioridad definida en ORDER_PRIORITY', schema: { type: 'string', enum: Object.values(ORDER_PRIORITY) } }
    ] : [])
  ],
  responses: {
    '200': response('Datos simulados generados en memoria; no se guardan en MongoDB', schema),
    '400': error(options.filters
      ? 'INVALID_MOCK_QUANTITY, INVALID_MOCK_DATA, INVALID_ORDER_STATUS o INVALID_ORDER_PRIORITY'
      : 'INVALID_MOCK_QUANTITY o INVALID_MOCK_DATA'),
    '500': error('MOCK_GENERATION_FAILED o INTERNAL_ERROR')
  }
});

const mockSeed = (summary, resultSchema, full = false) => ({
  tags: ['Mocks'],
  summary,
  description: full
    ? 'Inserta usuarios, repartidores, pedidos y entregas relacionados en MongoDB. Prohibido en producción.'
    : 'Inserta usuarios simulados en MongoDB. Prohibido en producción.',
  parameters: [qty],
  requestBody: emptyBody,
  responses: {
    '201': response('Cantidad efectivamente insertada', ref(resultSchema)),
    '400': error('INVALID_MOCK_QUANTITY, INVALID_MOCK_DATA o INVALID_JSON'),
    '403': error('MOCK_SEED_DISABLED: carga bloqueada en producción'),
    '500': error('MOCK_GENERATION_FAILED o INTERNAL_ERROR'),
    '503': error('MOCK_SEED_FAILED: falla al insertar registros')
  }
});

export const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'ShipNow API',
    version: '1.0.0',
    description: 'API REST ShipNow para administrar usuarios y productos, consultar pedidos y entregas, generar datos simulados y verificar logs. Documentación interactiva de las pre-entregas de Backend III.'
  },
  servers: [{
    url: 'http://localhost:3000',
    description: 'Servidor local de desarrollo (configuración predeterminada)'
  }],
  tags: [
    { name: 'Users', description: 'Consulta y administración de usuarios' },
    { name: 'Orders', description: 'Consulta de pedidos previamente existentes' },
    { name: 'Deliveries', description: 'Consulta de entregas previamente existentes' },
    { name: 'Mocks', description: 'Datos de prueba en memoria y cargas controladas a MongoDB' },
    { name: 'Logger', description: 'Herramientas internas de validación del registro de eventos' },
    { name: 'Products', description: 'Consulta y administración de productos' }
  ],
  components: { schemas },
  paths: {
    '/api/users': {
      get: {
        tags: ['Users'],
        summary: 'Listar usuarios',
        description: 'Devuelve los usuarios guardados en MongoDB.',
        responses: {
          '200': response('Lista de usuarios', success(list('Usuario'))),
          ...commonErrors
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Crear usuario',
        description: 'Se asigna el rol user automáticamente. No se permite enviar role.',
        requestBody: body('UsuarioCrear', 'Nombre, apellido y email obligatorios.'),
        responses: {
          '201': response('Usuario creado', success(ref('Usuario'))),
          ...userCreateErrors
        }
      }
    },
    '/api/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Obtener usuario por ID',
        parameters: [pathId],
        responses: {
          '200': response('Usuario encontrado', success(ref('Usuario'))),
          ...userReadErrors
        }
      },
      patch: {
        tags: ['Users'],
        summary: 'Actualizar campos de un usuario',
        description: 'Acepta uno o más de firstName, lastName y email. No permite cambiar el rol.',
        parameters: [pathId],
        requestBody: body('UsuarioActualizar', 'Campos a modificar.'),
        responses: {
          '200': response('Usuario actualizado', success(ref('Usuario'))),
          '400': error('INVALID_ID, INVALID_INPUT o INVALID_JSON'),
          '404': error('USER_NOT_FOUND'),
          '409': error('DUPLICATE_RECORD si el email ya está registrado'),
          ...commonErrors
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Eliminar usuario',
        parameters: [pathId],
        responses: {
          '204': response('Usuario eliminado. No devuelve cuerpo.'),
          ...userReadErrors
        }
      }
    },
    '/api/orders/{id}': {
      get: {
        tags: ['Orders'],
        summary: 'Consultar pedido por ID',
        description: 'Consulta un pedido guardado en MongoDB. Los pedidos de prueba se insertan desde /api/mocks/seed/all.',
        parameters: [pathId],
        responses: {
          '200': response('Pedido encontrado', success(ref('Pedido'))),
          '400': error('INVALID_ID'),
          '404': error('ORDER_NOT_FOUND'),
          ...commonErrors
        }
      }
    },
    '/api/deliveries/{id}': {
      get: {
        tags: ['Deliveries'],
        summary: 'Consultar entrega por ID',
        description: 'Consulta una entrega guardada en MongoDB; no hay rutas de creación o actualización de entregas.',
        parameters: [pathId],
        responses: {
          '200': response('Entrega encontrada', success(ref('Entrega'))),
          '400': error('INVALID_ID'),
          '404': error('DELIVERY_NOT_FOUND'),
          ...commonErrors
        }
      }
    },
    '/api/mocks/users': {
      get: mockRead('Generar usuarios simulados', 'Genera usuarios de prueba con roles válidos sin modificar MongoDB.', list('Usuario'))
    },
    '/api/mocks/couriers': {
      get: mockRead('Generar repartidores simulados', 'Genera usuarios con rol repartidor sin modificar MongoDB.', list('Usuario'))
    },
    '/api/mocks/orders': {
      get: mockRead('Generar pedidos simulados', 'Genera pedidos no persistidos. Se pueden filtrar por estado y prioridad válidos.', list('Pedido'), { filters: true })
    },
    '/api/mocks/deliveries': {
      get: mockRead('Generar entregas simuladas', 'Genera entregas no persistidas. Para ver relaciones completas con pedidos y usuarios, utilizar /api/mocks/bundle.', list('Entrega'))
    },
    '/api/mocks/bundle': {
      get: mockRead('Generar conjunto relacionado', 'Genera users, couriers, orders y deliveries con referencias internas coherentes; no inserta registros.', ref('MockBundle'))
    },
    '/api/mocks/seed': {
      post: mockSeed('Insertar usuarios simulados', 'MockSeedUsers')
    },
    '/api/mocks/seed/all': {
      post: mockSeed('Insertar conjunto completo de prueba', 'MockSeedBundle', true)
    },
    '/api/logger/test': {
      get: {
        tags: ['Logger'],
        summary: 'Probar los seis niveles del logger',
        description: 'Herramienta interna de validación, no funcionalidad de negocio. Emite debug, http, info, warning, error y fatal; deshabilitada en producción.',
        responses: {
          '200': response('Se registraron eventos de todos los niveles', ref('LoggerTest')),
          '403': error('LOGGER_TEST_DISABLED: no disponible en producción'),
          '500': error('INTERNAL_ERROR: fallo inesperado')
        }
      }
    },
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'Listar productos',
        description: 'Por defecto se muestran solo productos disponibles.',
        parameters: [{
          name: 'includeOutOfStock',
          in: 'query',
          required: false,
          description: 'El texto true incluye los productos agotados. Otros valores no activan el filtro.',
          schema: { type: 'string', enum: ['true', 'false'], default: 'false' }
        }],
        responses: {
          '200': response('Listado de productos', success(list('Producto'))),
          ...commonErrors
        }
      },
      post: {
        tags: ['Products'],
        summary: 'Crear producto',
        description: 'El estado se calcula según el stock; no se acepta status.',
        requestBody: body('ProductoCrear', 'Datos de producto.'),
        responses: {
          '201': response('Producto creado', success(ref('Producto'))),
          ...productInputErrors
        }
      }
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Obtener producto por ID',
        parameters: [pathId],
        responses: {
          '200': response('Producto encontrado', success(ref('Producto'))),
          ...productReadErrors
        }
      },
      patch: {
        tags: ['Products'],
        summary: 'Actualizar producto',
        description: 'Se puede modificar name, description, price o stock. El estado se recalcula desde stock.',
        parameters: [pathId],
        requestBody: body('ProductoActualizar', 'Uno o más campos de producto.'),
        responses: {
          '200': response('Producto actualizado', success(ref('Producto'))),
          '400': error('INVALID_ID, INVALID_INPUT o INVALID_JSON'),
          '404': error('PRODUCT_NOT_FOUND'),
          ...commonErrors
        }
      },
      delete: {
        tags: ['Products'],
        summary: 'Eliminar producto',
        parameters: [pathId],
        responses: {
          '204': response('Producto eliminado. No devuelve cuerpo.'),
          ...productReadErrors
        }
      }
    }
  }
};
