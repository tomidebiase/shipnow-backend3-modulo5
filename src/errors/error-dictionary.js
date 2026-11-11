const defineError = (statusCode, message) => Object.freeze({ statusCode, message });

export const ERROR_DICTIONARY = Object.freeze({
  INVALID_INPUT: defineError(400, 'Los datos enviados son inválidos'),
  INVALID_ID: defineError(400, 'El identificador no es válido'),
  INVALID_JSON: defineError(400, 'El JSON enviado no es válido'),
  INVALID_MOCK_QUANTITY: defineError(400, 'La cantidad de datos simulados es inválida'),
  INVALID_MOCK_DATA: defineError(400, 'Los parámetros de mocking son inválidos'),
  INVALID_ORDER_STATUS: defineError(400, 'El estado del pedido no es válido'),
  INVALID_ORDER_PRIORITY: defineError(400, 'La prioridad del pedido no es válida'),
  PAYLOAD_TOO_LARGE: defineError(413, 'La petición supera el tamaño permitido'),
  USER_NOT_FOUND: defineError(404, 'Usuario no encontrado'),
  PRODUCT_NOT_FOUND: defineError(404, 'Producto no encontrado'),
  ORDER_NOT_FOUND: defineError(404, 'Pedido no encontrado'),
  DELIVERY_NOT_FOUND: defineError(404, 'Entrega no encontrada'),
  ROUTE_NOT_FOUND: defineError(404, 'Ruta no encontrada'),
  LOGGER_TEST_DISABLED: defineError(403, 'La prueba de logging no está disponible en producción'),
  DUPLICATE_RECORD: defineError(409, 'El registro ya existe'),
  DUPLICATE_EMAIL: defineError(409, 'El correo electrónico ya está registrado'),
  MOCK_SEED_DISABLED: defineError(403, 'La carga de prueba no está disponible en producción'),
  MOCK_SEED_FAILED: defineError(503, 'No se pudo completar la carga de datos de prueba'),
  MOCK_GENERATION_FAILED: defineError(500, 'No se pudieron generar los datos de prueba'),
  DATABASE_UNAVAILABLE: defineError(503, 'La base de datos no está disponible'),
  INTERNAL_ERROR: defineError(500, 'Error interno del servidor')
});
