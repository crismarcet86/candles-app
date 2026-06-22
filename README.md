# 🕯️ Candles App — Backend

Sistema de gestión para un emprendimiento de velas artesanales. Permite mantener categorías, unidades de medida y productos con stock, generar proformas (calculadora de costos) y convertirlas en órdenes con descuento automático de inventario.

---

## Tecnologías

- **Runtime:** Node.js 20+
- **Framework:** Express 4
- **Base de datos:** MySQL 8+ (driver: mysql2)
- **Validación:** express-validator
- **Logs:** winston
- **Dev:** nodemon

---

## Estructura del proyecto

```
candles-app/
├── src/
│   ├── server.js              # Punto de entrada — carga .env, conecta DB y levanta Express
│   ├── app.js                 # Instancia de Express, middlewares globales, registro de rutas
│   │
│   ├── config/
│   │   ├── database.js        # Pool de conexiones MySQL (mysql2/promise)
│   │   └── migrate.js         # Script para crear tablas y datos base (npm run db:migrate)
│   │
│   ├── models/                # Acceso a datos — consultas SQL directas, sin ORM
│   │   ├── Category.js        # CRUD de categorías (eliminación lógica)
│   │   ├── Unit.js            # CRUD de unidades de medida (g, kg, u, ml, etc.)
│   │   ├── Product.js         # CRUD de productos + ajuste de stock con transacción
│   │   ├── Client.js          # CRUD de clientes (eliminación lógica)
│   │   ├── Proforma.js        # Calculadora: guarda/edita proforma y la confirma en orden
│   │   └── Order.js           # Lectura de órdenes generadas al confirmar una proforma
│   │
│   ├── controllers/           # Manejo de req/res — delegan lógica a los modelos
│   │   ├── categoryController.js
│   │   ├── unitController.js
│   │   ├── productController.js
│   │   ├── clientController.js
│   │   ├── proformaController.js  # Incluye endpoint /confirm que descuenta stock
│   │   └── orderController.js
│   │
│   ├── routes/                # Definición de rutas y reglas de validación
│   │   ├── index.js           # Agrupador principal → /api/*
│   │   ├── categoryRoutes.js  # GET/POST/PUT/DELETE /api/categories
│   │   ├── unitRoutes.js      # GET/POST/PUT/DELETE /api/units
│   │   ├── productRoutes.js   # GET/POST/PUT/DELETE /api/products
│   │   ├── clientRoutes.js    # GET/POST/PUT/DELETE /api/clients
│   │   ├── proformaRoutes.js  # GET/POST/PUT /api/proformas + /:id/confirm + /:id/cancel
│   │   └── orderRoutes.js     # GET /api/orders + PATCH /:id/status
│   │
│   ├── middlewares/
│   │   ├── errorHandler.js    # Manejo global de errores (siempre al final en app.js)
│   │   └── validate.js        # Lee errores de express-validator y retorna 400
│   │
│   └── utils/
│       ├── logger.js          # Logger winston (consola + archivos logs/)
│       └── response.js        # Helpers: success(), created(), notFound(), badRequest()
│
├── logs/                      # Archivos de log generados en tiempo de ejecución
├── .env.example               # Variables de entorno requeridas
├── .gitignore
└── package.json
```

---

## Modelo de datos

```
categories      ←── products ───→ units
                        │
                 proforma_items
                        │
                    proformas ────→ clients
                        │
                  order_items
                        │
                      orders
```

### Tablas principales

| Tabla | Descripción |
|---|---|
| `categories` | Agrupaciones de productos (Velas, Fragancias, Materias primas…) |
| `units` | Unidades de medida: g, kg, ml, l, u, oz, lb |
| `products` | Productos con precio, stock y stock mínimo de alerta |
| `clients` | Compradores registrados |
| `proformas` | Calculadora / cotización. Estado: `borrador → confirmada / cancelada` |
| `proforma_items` | Líneas de la proforma (producto + cantidad + precio al momento) |
| `orders` | Orden generada al confirmar una proforma (stock ya descontado) |
| `order_items` | Copia de las líneas al momento de la confirmación |

---

## API — Endpoints

Prefijo base: `/api`

### Categorías `/categories`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/categories` | Listar todas |
| GET | `/categories/:id` | Obtener una |
| POST | `/categories` | Crear |
| PUT | `/categories/:id` | Editar |
| DELETE | `/categories/:id` | Desactivar (lógico) |

### Unidades `/units`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/units` | Listar todas |
| GET | `/units/:id` | Obtener una |
| POST | `/units` | Crear |
| PUT | `/units/:id` | Editar |
| DELETE | `/units/:id` | Eliminar |

### Productos `/products`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/products` | Listar todos (con categoría y unidad) |
| GET | `/products/:id` | Obtener uno |
| POST | `/products` | Crear |
| PUT | `/products/:id` | Editar |
| DELETE | `/products/:id` | Desactivar (lógico) |

Body de creación/edición:
```json
{
  "category_id": 1,
  "unit_id": 2,
  "name": "Cera de soya",
  "description": "Cera 100% natural",
  "price": 3.50,
  "stock": 5000,
  "min_stock": 500
}
```

### Clientes `/clients`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/clients` | Listar todos |
| GET | `/clients/:id` | Obtener uno |
| POST | `/clients` | Crear |
| PUT | `/clients/:id` | Editar |
| DELETE | `/clients/:id` | Desactivar (lógico) |

### Proformas `/proformas`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/proformas` | Listar todas |
| GET | `/proformas/:id` | Obtener una con ítems |
| POST | `/proformas` | Crear proforma (calcula totales automáticamente) |
| PUT | `/proformas/:id` | Editar proforma en borrador |
| POST | `/proformas/:id/confirm` | **Confirmar → crea orden y descuenta stock** |
| POST | `/proformas/:id/cancel` | Cancelar proforma en borrador |

Body de creación/edición:
```json
{
  "client_id": 1,
  "notes": "Pedido especial navidad",
  "discount": 5.00,
  "items": [
    { "product_id": 1, "quantity": 200 },
    { "product_id": 3, "quantity": 2 }
  ]
}
```

### Órdenes `/orders`
| Método | Ruta | Acción |
|---|---|---|
| GET | `/orders` | Listar todas |
| GET | `/orders/:id` | Obtener una con ítems |
| PATCH | `/orders/:id/status` | Cambiar estado (`pendiente`, `entregado`, `cancelado`) |

Las órdenes solo se crean al confirmar una proforma, nunca directamente.

---

## Respuesta estándar

Todas las rutas devuelven el mismo formato:

```json
{
  "ok": true,
  "message": "OK",
  "data": { }
}
```

En caso de error:
```json
{
  "ok": false,
  "message": "Descripción del error",
  "errors": [ ]
}
```

---

## Puesta en marcha

### 1. Requisitos previos
- Node.js 20 o superior
- MySQL 8 corriendo localmente

### 2. Instalación

```bash
# Clonar / descomprimir el proyecto
cd candles-app

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

### 3. Crear base de datos y tablas

```bash
# Crear la base de datos en MySQL primero
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS candles_app CHARACTER SET utf8mb4;"

# Ejecutar migración (crea tablas + datos base de unidades y categorías)
npm run db:migrate
```

### 4. Ejecutar

```bash
# Desarrollo (reinicio automático con nodemon)
npm run dev

# Producción
npm start
```

El servidor queda disponible en `http://localhost:3000`.
Verifica: `GET http://localhost:3000/health`

---

## Variables de entorno (`.env`)

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del servidor | `3000` |
| `NODE_ENV` | Entorno: `development` / `production` | `development` |
| `DB_HOST` | Host de MySQL | `localhost` |
| `DB_PORT` | Puerto de MySQL | `3306` |
| `DB_USER` | Usuario de MySQL | `root` |
| `DB_PASSWORD` | Contraseña de MySQL | — |
| `DB_NAME` | Nombre de la base de datos | `candles_app` |
| `CORS_ORIGIN` | Origen permitido para CORS (Angular) | `*` |

---

## Flujo principal de uso

```
1. Mantener categorías     →  /api/categories
2. Mantener unidades       →  /api/units
3. Mantener productos      →  /api/products  (con stock inicial)
4. Mantener clientes       →  /api/clients
5. Crear proforma          →  POST /api/proformas
   └─ sistema calcula subtotal y total automáticamente
6. Revisar / ajustar       →  PUT /api/proformas/:id
7. Confirmar               →  POST /api/proformas/:id/confirm
   └─ crea la orden y descuenta stock de cada producto
8. Seguimiento             →  PATCH /api/orders/:id/status
```

---

## Convenciones de código

- Modelos en `src/models/` — solo SQL, sin lógica de HTTP.
- Controladores en `src/controllers/` — solo manejo de req/res, delegan a modelos.
- Rutas en `src/routes/` — definen paths y validaciones con express-validator.
- Toda transacción con múltiples escrituras usa `conn.beginTransaction()` / `commit()` / `rollback()`.
- Eliminaciones son lógicas (campo `is_active = 0`) para no romper historial.

---

## Próximos pasos sugeridos

- [ ] Integrar Anthropic SDK (`@anthropic-ai/sdk`) para asistencia IA (ya está previsto en `.env.example`)
- [ ] Agregar autenticación JWT para acceso desde Angular
- [ ] Módulo de reportes: ventas por período, productos más vendidos, alertas de stock mínimo
- [ ] Frontend Angular con los módulos correspondientes a cada sección
