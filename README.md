# ShipNow API

API REST para la gestión inicial de usuarios y productos de ShipNow, desarrollada con Node.js, Express, MongoDB y Mongoose.

## Requisitos

- Node.js 20 o superior
- npm
- MongoDB local o una instancia de MongoDB Atlas

## Instalación

1. Clonar el repositorio y entrar en el proyecto.
2. Instalar las dependencias con `npm install`.
3. Copiar `.env.example` a `.env` y completar las variables:

   ```env
   PORT=8080
   MONGODB_URI=mongodb://127.0.0.1:27017/shipnow
   NODE_ENV=development
   ```

   La URI es un ejemplo para una instancia local; reemplazarla por la propia conexión cuando corresponda. El archivo `.env` está ignorado por Git.

4. Iniciar con `npm run dev` o `npm start`.
5. Ejecutar las pruebas con `npm test`.

El servidor se inicia únicamente si las variables `PORT`, `MONGODB_URI` y `NODE_ENV` son válidas y la conexión a MongoDB se establece correctamente. Si falta una variable obligatoria, se muestra un error descriptivo y la aplicación no arranca.

## Organización

```text
src/
├── app.js
├── server.js
├── config/
│   ├── index.js
│   ├── env.config.js
│   └── database.js
├── constants/
│   └── index.js
├── controllers/
│   ├── products.controller.js
│   └── users.controller.js
├── middlewares/
│   └── error-handler.js
├── models/
│   ├── product.model.js
│   └── user.model.js
├── repositories/
│   ├── products.repository.js
│   └── users.repository.js
├── routes/
│   ├── products.router.js
│   └── users.router.js
├── services/
│   ├── products.service.js
│   └── users.service.js
└── utils/
    ├── api-error.js
    └── constants.js
```

### Separación de responsabilidades

El recorrido de cada petición es **Router → Controller → Service → Repository → Model**.

- **Router:** vincula cada URL y método HTTP con el controlador correspondiente.
- **Controller:** recibe parámetros y datos de la petición, invoca el servicio y define el código HTTP de respuesta.
- **Service:** concentra las reglas del negocio. Calcula el estado de un producto según el stock, valida precios y datos de usuario y asigna el rol inicial `USER`.
- **Repository:** encapsula el acceso a MongoDB. Aplica filtros, proyecciones y ordenamiento en las consultas, sin decidir reglas comerciales ni permisos.
- **Model:** define los esquemas y restricciones básicas de los documentos almacenados.

Esta separación permite modificar consultas a la base de datos sin alterar reglas de negocio y probar los servicios de forma aislada.

Los valores fijos para roles y estados de producto están centralizados en `src/constants/index.js` mediante `Object.freeze`. `src/utils/constants.js` los reexporta para mantener una ubicación alternativa compatible con el material del módulo.

## Endpoints

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/api/products` | Listar productos disponibles |
| GET | `/api/products?includeOutOfStock=true` | Listar todos los productos |
| GET | `/api/products/:id` | Obtener un producto |
| POST | `/api/products` | Crear un producto |
| PATCH | `/api/products/:id` | Actualizar un producto |
| DELETE | `/api/products/:id` | Eliminar un producto |
| GET | `/api/users` | Listar usuarios |
| GET | `/api/users/:id` | Obtener un usuario |
| POST | `/api/users` | Crear un usuario |
| PATCH | `/api/users/:id` | Actualizar un usuario |
| DELETE | `/api/users/:id` | Eliminar un usuario |

### Ejemplo: crear producto

`POST http://localhost:8080/api/products`

```json
{
  "name": "Caja de embalaje",
  "description": "Caja de cartón mediana",
  "price": 1500,
  "stock": 12
}
```

El estado es `available` si el stock es mayor a cero, o `out_of_stock` si es cero. No se permite enviar el estado directamente porque se determina en el servicio.

### Ejemplo: crear usuario

`POST http://localhost:8080/api/users`

```json
{
  "firstName": "Ana",
  "lastName": "García",
  "email": "ana@example.com"
}
```

Los usuarios nuevos reciben el rol `user`. La API no permite asignar o modificar el rol mediante estas rutas.

### Respuestas

- `200`: consulta o actualización exitosa.
- `201`: creación exitosa.
- `204`: eliminación exitosa, sin cuerpo de respuesta.
- `400`: datos inválidos.
- `404`: recurso no encontrado.
- `409`: registro duplicado.
- `500`: error interno.

## Alcance

Esta primera versión organiza las entidades Products y Users y deja lista la configuración común para módulos posteriores. No incluye inicio de sesión, autenticación ni autorización; las rutas deben utilizarse en un entorno de desarrollo hasta incorporar esas protecciones.

## Pre-entrega Módulo 2 — Mocking y carga de datos

El módulo permite generar datos de prueba sin guardarlos o insertarlos en MongoDB. Conserva el esquema de usuarios existente y agrega el rol `repartidor`, pedidos con estado y prioridad, y entregas relacionadas con pedidos y repartidores.

### Estructura y relaciones

- `src/routes/mocks.router.js`: expone las rutas HTTP.
- `src/controllers/mocks.controller.js`: maneja las peticiones y respuestas.
- `src/services/mocks.generator.js`: genera usuarios, repartidores, pedidos y entregas relacionados.
- `src/services/mocks.service.js`: valida cantidades y controla las cargas.
- `src/repositories/mocks.repository.js`: encapsula las inserciones en MongoDB.
- `src/models/order.model.js` y `src/models/delivery.model.js`: modelan pedidos y entregas.

Los pedidos tienen una referencia a un usuario con rol `user`. Las entregas referencian un pedido y, si están asignadas, un usuario con rol `repartidor`. Los roles, estados y prioridades se definen como constantes inmutables y se utilizan en los esquemas.

### Datos simulados que no se guardan

Con la API levantada mediante `npm start`:

| Método | Endpoint | Descripción |
| --- | --- | --- |
| GET | `/api/mocks/users?qty=2` | Dos usuarios simulados |
| GET | `/api/mocks/couriers?qty=2` | Dos repartidores |
| GET | `/api/mocks/orders?qty=2` | Dos pedidos |
| GET | `/api/mocks/deliveries?qty=2` | Dos entregas |
| GET | `/api/mocks/bundle?qty=2` | Conjunto de usuarios, repartidores, pedidos y entregas con referencias coherentes |

```bash
curl -i "http://localhost:3000/api/mocks/users?qty=2"
curl -i "http://localhost:3000/api/mocks/bundle?qty=3"
```

Los endpoints individuales generan conjuntos independientes; para comprobar referencias entre entidades usá `/api/mocks/bundle`. Ninguna de estas consultas inserta datos en MongoDB.

El parámetro `qty` es opcional, predeterminado a 10, y acepta enteros entre 1 y 100. Un valor fuera de rango devuelve HTTP 400.

### Carga de datos de prueba en MongoDB

Carga simple: inserta usuarios simulados en `users`.

```bash
curl -i -X POST "http://localhost:3000/api/mocks/seed?qty=10"
```

Respuesta HTTP 201:

```json
{ "insertados": 10, "coleccion": "usuarios" }
```

Carga completa: inserta clientes y repartidores en `users`, pedidos en `orders` y entregas en `deliveries`.

```bash
curl -i -X POST "http://localhost:3000/api/mocks/seed/all?qty=10"
```

Respuesta HTTP 201 de ejemplo:

```json
{
  "insertados": { "usuarios": 14, "repartidores": 4, "pedidos": 10, "entregas": 10 },
  "colecciones": ["usuarios", "pedidos", "entregas"]
}
```

`repartidores` es un subconjunto de `usuarios`, no un conteo adicional. Los correos usan `example.test` y un identificador aleatorio para evitar colisiones entre tandas.

En caso de falla, el repositorio intenta retirar solo los documentos creados durante esa solicitud. Esta compensación no equivale a una transacción atómica.

La carga está bloqueada cuando `NODE_ENV=production`. En desarrollo los endpoints no tienen autenticación: no expongas públicamente el servidor. Para observar datos insertados podés usar MongoDB Atlas; las rutas GET de mocks generan nuevas muestras y no leen los registros guardados.

### Pruebas y observaciones de la entrega anterior

```bash
npm test
```

Las pruebas verifican generación de datos, roles, estados, prioridades, asociaciones, límites de cantidad, endpoints HTTP y bloqueo de inserciones en producción. La carga real de datos relacionada debe comprobarse contra MongoDB antes de la entrega.

Se agregó validación de ObjectId en los servicios para responder HTTP 400 a identificadores mal formados y HTTP 404 a registros válidos inexistentes.

---

## Pre-entrega Módulo 3 — Manejo profesional de errores

La API centraliza las respuestas de error mediante excepciones del dominio, un diccionario de códigos y un middleware global. Los controllers no construyen respuestas de error: entregan las excepciones a `next(error)`.

### Organización

| Archivo | Responsabilidad |
| --- | --- |
| `src/errors/error-dictionary.js` | Códigos, estados HTTP y mensajes |
| `src/errors/domain-errors.js` | Clases de errores propios del dominio |
| `src/errors/normalize-error.js` | Traduce errores de Express, validación y MongoDB |
| `src/middlewares/error-handler.js` | Genera la respuesta final uniforme |
| `src/services/*.service.js` | Valida los datos y lanza excepciones |
| `src/repositories/*.repository.js` | Ejecuta operaciones de persistencia |

La estructura de una respuesta de error es:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "qty debe ser un número entero positivo"
  }
}
```

`code` permite identificar el tipo de error y `message` describe el problema. Las causas internas de fallos de MongoDB se conservan para diagnóstico y no se exponen en la respuesta.

### Tipos de error

| Situación | Código | Estado HTTP |
| --- | --- | --- |
| Identificador inválido | `INVALID_ID` | 400 |
| Usuario inexistente | `USER_NOT_FOUND` | 404 |
| Producto inexistente | `PRODUCT_NOT_FOUND` | 404 |
| Pedido inexistente | `ORDER_NOT_FOUND` | 404 |
| Estado no permitido | `INVALID_ORDER_STATUS` | 400 |
| Prioridad no permitida | `INVALID_ORDER_PRIORITY` | 400 |
| Cantidad de mocks inválida | `INVALID_MOCK_QUANTITY` | 400 |
| Parámetros extra o cuerpo incorrecto de mocks | `INVALID_MOCK_DATA` | 400 |
| JSON malformado | `INVALID_JSON` | 400 |
| Correo duplicado | `DUPLICATE_EMAIL` | 409 |
| Carga de mocks deshabilitada en producción | `MOCK_SEED_DISABLED` | 403 |
| Fallo de carga en MongoDB | `MOCK_SEED_FAILED` | 503 |
| Error de conexión a MongoDB | `DATABASE_UNAVAILABLE` | 503 |
| Ruta inexistente | `ROUTE_NOT_FOUND` | 404 |
| Error inesperado | `INTERNAL_ERROR` | 500 |

El endpoint `GET /api/orders/:id` permite consultar pedidos, y responde mediante el mismo middleware ante IDs inválidos o pedidos inexistentes. Los valores de roles, estados y prioridades conservan las constantes del Módulo 2.

### Pruebas manuales de casos inválidos

Con `npm start` iniciado en una terminal, ejecutar en otra:

```bash
curl -i "http://localhost:3000/api/mocks/users?qty=-3"
curl -i "http://localhost:3000/api/mocks/orders?qty=2&status=incorrecto"
curl -i "http://localhost:3000/api/mocks/orders?qty=2&priority=urgente"
curl -i "http://localhost:3000/api/mocks/bundle?qty=2&extra=1"
curl -i -X POST "http://localhost:3000/api/mocks/seed?qty=0"
curl -i -X POST "http://localhost:3000/api/mocks/seed/all?qty=2" -H "Content-Type: application/json" -d '{"qty":-2}'
curl -i "http://localhost:3000/api/orders/no-es-un-id"
curl -i "http://localhost:3000/api/users/000000000000000000000000"
curl -i "http://localhost:3000/api/ruta-incorrecta"
curl -i -X POST "http://localhost:3000/api/products" -H "Content-Type: application/json" -d '{"name":'
```

Ninguno de estos ejemplos de error necesita insertar registros en MongoDB. `GET /api/mocks/orders?qty=2&status=delivered&priority=high` permite verificar un caso válido con estado y prioridad definidos por las constantes. Los filtros `status` y `priority` se permiten únicamente en ese endpoint de mocks.

Los endpoints de carga `POST /api/mocks/seed?qty=2` y `POST /api/mocks/seed/all?qty=2` modifican la base de datos cuando `NODE_ENV` es distinto de `production`. Si hay un error durante la inserción, el repositorio intenta revertir los documentos de esa tanda; el mecanismo no es una transacción atómica.

### Pruebas automáticas

Instalar las dependencias y ejecutar:

```bash
npm install
npm test
```

Las pruebas abarcan el diccionario, las excepciones del dominio, el middleware global, la normalización de errores, las validaciones de mocking y las rutas HTTP. Los casos de fallos de MongoDB en las pruebas emplean repositorios simulados, por lo que no se eliminan datos reales durante la ejecución.

---

## Pre-entrega Módulo 4 — Logging y monitoreo básico

La aplicación utiliza **Winston** y una configuración centralizada en `src/config/logger.js`. Los módulos de servidor, MongoDB, manejo de errores y mocking comparten la misma instancia del logger.

### Niveles de logging

| Nivel | Prioridad | Uso |
| --- | ---: | --- |
| `fatal` | 0 | Fallas críticas al iniciar el servicio |
| `error` | 1 | Problemas del servidor y de MongoDB |
| `warning` | 2 | Validaciones rechazadas y errores esperados |
| `info` | 3 | Inicio, conexión, creación de registros y datos mock |
| `http` | 4 | Solicitudes HTTP completadas |
| `debug` | 5 | Diagnóstico detallado |

Los registros incluyen fecha, hora, nivel y mensaje, con detalles adicionales en JSON cuando corresponde.

- En desarrollo (`NODE_ENV=development`), la consola muestra los seis niveles, incluidos `http` y `debug`.
- En producción (`NODE_ENV=production`), la consola muestra `info`, `warning`, `error` y `fatal`.
- En pruebas (`NODE_ENV=test`), se silencia la consola del logger, pero se conserva la salida de errores a archivo.

### Persistencia y rotación

El archivo `logs/error.log` recibe **exclusivamente los niveles `error` y `fatal`**. No incluye `warning`, `info`, `http` ni `debug`.

Winston configura rotación por tamaño con un límite de **5 MB por archivo** y un máximo de **7 archivos** mediante `maxsize`, `maxFiles` y `tailable`. No requiere ningún servicio externo ni tarea programada para rotar los registros.

La carpeta `logs/`, el archivo de credenciales `.env` y `node_modules/` se excluyen de Git mediante `.gitignore`. Ningún archivo de log generado debe subirse al repositorio.

### Endpoint de prueba

Iniciá el proyecto con `npm start` y ejecutá:

```bash
curl -i http://localhost:3000/api/logger/test
```

Respuesta esperada:

```json
{
  "status": "success",
  "levels": ["debug", "http", "info", "warning", "error", "fatal"],
  "message": "Eventos de prueba registrados"
}
```

En desarrollo se generan seis eventos en consola. El archivo `logs/error.log` debe contener solamente las dos entradas correspondientes a `error` y `fatal`.

Por seguridad, el endpoint de prueba está **deshabilitado en producción**, donde responde HTTP 403 con el formato de errores centralizado del Módulo 3.

### Integración con los módulos anteriores

Se registran eventos del inicio del servidor, conexión y fallas de MongoDB, manejo global de errores, solicitudes HTTP, generación y carga de mocks, creación de usuarios y productos y búsquedas de pedidos inexistentes.

Los errores esperados de negocio se registran como `warning`, los inesperados como `error` y las fallas críticas de arranque como `fatal`. Los logs no incluyen contraseñas ni cuerpos completos de solicitudes, y las respuestas HTTP conservan la estructura uniforme del Módulo 3.

Para comprobar la clasificación de eventos:

```bash
curl -i "http://localhost:3000/api/mocks/users?qty=-3"
curl -i "http://localhost:3000/api/orders/no-es-un-id"
curl -i "http://localhost:3000/api/logger/test"
```

Los dos primeros generan advertencias controladas, mientras que el último emite los seis niveles de prueba.

### Instalación y pruebas automáticas

```bash
npm install
npm test
```

Las pruebas incluyen niveles, configuración por entorno, formato de salida, filtrado de `logs/error.log`, endpoint del logger y las pruebas heredadas de los módulos anteriores. El proyecto conserva la arquitectura por capas.

---

## Pre-entrega Módulo 5 — Documentación de API con Swagger

La documentación interactiva se encuentra en **`http://localhost:3000/api/docs/`**. La especificación **OpenAPI 3.0.3** está separada de la lógica de rutas en `src/docs/openapi.js` y `src/docs/schemas.js`, y la interfaz se sirve con `swagger-ui-express`.

También se publica el contrato en formato JSON en **`http://localhost:3000/api/docs/openapi.json`**.

### Instalación y acceso

Instalar dependencias:

```bash
npm install
```

Copiar `.env.example` a `.env` y configurar `PORT`, `MONGODB_URI` y `NODE_ENV`. Para levantar el servidor debe haber una conexión MongoDB disponible.

```bash
npm start
```

Abrir `http://localhost:3000/api/docs/`. En Swagger UI expandir un endpoint, seleccionar **Try it out**, completar parámetros y ejecutar la solicitud.

### Módulos documentados

| Tag | Rutas y operaciones |
| --- | --- |
| **Users** | `GET/POST /api/users`; `GET/PATCH/DELETE /api/users/{id}` |
| **Orders** | `GET /api/orders/{id}` |
| **Deliveries** | `GET /api/deliveries/{id}` |
| **Mocks** | `GET /api/mocks/users`, `/couriers`, `/orders`, `/deliveries`, `/bundle`; `POST /api/mocks/seed` y `/seed/all` |
| **Logger** | `GET /api/logger/test` |
| **Products** | `GET/POST /api/products`; `GET/PATCH/DELETE /api/products/{id}` |

La consulta `GET /api/deliveries/{id}` se incorporó en esta pre-entrega, con su propio router, controller, service y repository, usando el modelo de entregas y el middleware global de errores existentes.

No hay rutas HTTP para crear o modificar pedidos y entregas directamente: esos datos pueden insertarse con `POST /api/mocks/seed/all` en desarrollo.

### Schemas reutilizables

El documento expone `Usuario`, `Pedido`, `Entrega`, `ItemPedido`, `Error`, `RespuestaExitosa`, `Producto`, schemas de entrada de usuarios/productos y respuestas de mocks y logger.

Las opciones de `role`, `status` y `priority` se toman de las constantes existentes.

**`ItemPedido` es un schema de referencia**, preparado para una futura extensión. El modelo actual de pedido utiliza `description` y `totalAmount` y no tiene el campo `items`. No se documenta `items` como parte de las solicitudes o respuestas actuales.

### Respuestas y errores reales

Los endpoints de usuarios, productos, pedidos y entregas devuelven `{ "status": "success", "payload": ... }` cuando corresponde. Los métodos `DELETE` exitosos devuelven **204 sin body**.

Los endpoints GET de Mocks devuelven directamente listas de entidades o el objeto `bundle`; no guardan esos datos. Las cargas POST de Mocks responden **201** con `insertados` y `coleccion` o `colecciones`.

Todos los errores se documentan con la respuesta común:

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_MOCK_QUANTITY",
    "message": "qty debe ser un número entero positivo"
  }
}
```

La documentación incluye, según la ruta, los estados HTTP **400, 403, 404, 409, 500 y 503**. No se define autenticación porque la API actual no la implementa.

### Aclaraciones para probar los mocks y el logger

En los endpoints de Mocks, `qty` es opcional, admite enteros de **1 a 100** y tiene valor predeterminado **10**. `status` y `priority` solamente se admiten como filtros en `GET /api/mocks/orders`.

Las cargas POST de Mocks esperan `qty` en la URL, **sin cuerpo obligatorio**. Se acepta no enviar body o enviar el JSON vacío `{}`; cualquier otro campo provoca `INVALID_MOCK_DATA`.

En producción, las cargas de mocks devuelven **403**, por lo que las pruebas con inserciones deben realizarse solo en un entorno de desarrollo autorizado.

`GET /api/logger/test` es una **herramienta interna para validar los seis niveles de Winston**, no una funcionalidad de negocio. Está deshabilitada en producción con respuesta 403.

Ejemplos:

```bash
curl -i http://localhost:3000/api/docs/openapi.json
curl -i "http://localhost:3000/api/mocks/users?qty=2"
curl -i "http://localhost:3000/api/mocks/orders?qty=2&status=delivered"
curl -i "http://localhost:3000/api/mocks/orders?qty=2&priority=incorrecta"
curl -i "http://localhost:3000/api/deliveries/id-invalido"
```

Los dos siguientes ejemplos **sí insertan datos** en MongoDB:

```bash
curl -i -X POST "http://localhost:3000/api/mocks/seed?qty=2"
curl -i -X POST "http://localhost:3000/api/mocks/seed/all?qty=2"
```

### Pruebas automáticas

```bash
npm test
```

La batería de pruebas verifica el contrato OpenAPI, tags, schemas y referencias, rutas y métodos coincidentes con Express, parámetros y bodies, formato de respuesta, Swagger UI y la consulta de entregas. También se ejecutan los tests de los módulos anteriores.
