# 🕯️ Candles App

Sistema de gestión para un emprendimiento de velas artesanales. Permite gestionar ingredientes (cera, esencia, pabilos), moldes con tipo y capacidad en gramos, clientes, cotizaciones (proformas) con descuentos, confirmar pedidos descontando stock, calcular costos con fragmentos %, color y mano de obra, ajustar inventario y exportar reportes en PDF.

- **Backend:** Node.js + Express + MySQL — puerto 3000
- **Frontend:** Angular 16 SPA — puerto 4200

---

## Instalación desde cero

### Requisitos previos
- [Node.js 18+](https://nodejs.org)
- MySQL 8 corriendo localmente

### 1. Clonar el repositorio
```bash
git clone https://github.com/crismarcet86/candles-app.git
cd candles-app
```

### 2. Crear la base de datos en MySQL
```sql
CREATE DATABASE candles_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Configurar variables de entorno
```bash
cp .env.example .env
```
Editá `.env` con tus credenciales:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=candles_db
JWT_SECRET=cualquier_texto_secreto
CORS_ORIGIN=http://localhost:4200
```

### 4. Instalar dependencias del backend
```bash
npm install
```

### 5. Inicializar la base de datos (ejecutar en orden)
```bash
npm run db:migrate
node src/config/migrate-v2.js
node src/config/migrate-cedula.js
node src/config/migrate-settings.js
node src/config/migrate-presets.js
node src/config/migrate-mold-types.js
node src/config/migrate-presets-v2.js
node src/config/migrate-presets-v3.js
node src/config/migrate-presets-v4.js
node src/config/migrate-username.js
node src/config/migrate-report-logo.js
node src/config/migrate-mold-type-image.js
```

> **Nota:** cada script verifica si la columna/tabla ya existe antes de crearla, por lo que son idempotentes y pueden ejecutarse más de una vez sin error.

### 6. Instalar dependencias del frontend
```bash
cd frontend && npm install && cd ..
```

### 7. Levantar los servidores (en terminales separadas)

**Terminal 1 — Backend:**
```bash
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd frontend && npm start
```

### 8. Abrir en el navegador
```
http://localhost:4200
```

---

## Tecnologías

| Capa | Stack |
|---|---|
| Backend | Node.js, Express 4, mysql2, express-validator, winston, pdfkit, JWT |
| Frontend | Angular 16, HttpClient, Reactive Forms, lazy loading |
| Base de datos | MySQL 8 |

---

## Estructura del proyecto

```
candles-app/
├── src/
│   ├── server.js              # Punto de entrada
│   ├── app.js                 # Express: middlewares y rutas
│   ├── config/
│   │   ├── database.js        # Pool MySQL
│   │   ├── migrate.js         # Schema inicial + seeding
│   │   ├── migrate-v2.js      # Adapta al modelo de velas
│   │   ├── migrate-cedula.js  # Agrega cédula a clientes
│   │   ├── migrate-settings.js  # Configuración del negocio (nombre, RUC, logo)
│   │   ├── migrate-presets.js   # Presets de calculadora vinculados a proformas
│   │   ├── migrate-mold-types.js # Tipos de molde + total_grams en molds
│   │   ├── migrate-presets-v2.js # includes_color en presets; fragrance_pct en preset_items
│   │   ├── migrate-presets-v3.js # labor_cost en calculation_presets
│   │   ├── migrate-presets-v4.js # labor_hours en calculation_presets
│   │   └── migrate-username.js   # username NOT NULL UNIQUE en users
│   ├── models/                # Queries SQL directas (sin ORM)
│   ├── controllers/           # Manejo de req/res
│   ├── routes/                # Rutas + validaciones express-validator
│   ├── middlewares/           # auth, errorHandler, validate
│   └── utils/                 # logger, response, pdfProforma, pdfReport, pdfList, pdfHeader
├── frontend/                  # Angular 16 SPA
│   └── src/app/modules/
│       ├── auth/              # Login y registro
│       ├── dashboard/         # Inicio con accesos rápidos y métricas
│       ├── categories/        # Categorías de ingredientes (con flag is_fragrance)
│       ├── units/             # Unidades de medida
│       ├── products/          # Ingredientes (cera, esencia, pabilo…)
│       ├── stock/             # Stock: agregar, dar de baja, toma de inventario
│       ├── mold-types/        # Tipos de molde (CRUD)
│       ├── molds/             # Moldes con tipo, agua y cera en gramos
│       ├── clients/           # Clientes (cédula, teléfono, dirección, correo)
│       ├── proformas/         # Cotizaciones → PDF con datos de cliente
│       ├── orders/            # Pedidos confirmados
│       ├── calculator/        # Calculadora: fragancia %, color, mano de obra (tarifa × horas)
│       └── reports/           # Reportes KPI + PDF exportable
├── .env.example
├── .gitignore
└── package.json
```

---

## Migraciones — detalle

| Script | Qué hace |
|---|---|
| `migrate.js` | Schema inicial: users, categories, units, products, clients, proformas, orders |
| `migrate-v2.js` | Adapta al modelo de velas: molds, labor_cost, items opcionales |
| `migrate-cedula.js` | Agrega campo `cedula` a clients |
| `migrate-settings.js` | Tabla `business_settings` (nombre, RUC, teléfono, logo) |
| `migrate-presets.js` | Tablas `calculation_presets` y `calculation_preset_items`; columna `preset_id` en proforma_items |
| `migrate-mold-types.js` | Tabla `mold_types`; columnas `total_grams` y `mold_type_id` en molds |
| `migrate-presets-v2.js` | Columna `includes_color` en `calculation_presets`; `fragrance_pct` en `calculation_preset_items` |
| `migrate-presets-v3.js` | Columna `labor_cost` en `calculation_presets` |
| `migrate-presets-v4.js` | Columna `labor_hours` en `calculation_presets` (default 1) |
| `migrate-username.js` | Columna `username VARCHAR(100) NOT NULL UNIQUE` en `users`; poblada desde prefijo de email |
| `migrate-report-logo.js` | Columna `report_logo_path` en `business_settings` para imagen exclusiva de PDFs |
| `migrate-mold-type-image.js` | Columna `image_path` en `mold_types` para imagen referencial del tipo |

> Las columnas `is_fragrance` en `categories` y los ajustes de stock (`writeoff`, `inventory-count`) no requieren script separado — se agregaron con `ALTER TABLE` directo.

---

## Modelo de datos

```
users (autenticación y roles — login por username)

categories (is_fragrance) ←── products (ingredientes) ───→ units
                                        │
                                 proforma_items ──────────→ proformas ───→ clients
                                        │   (preset_id)       (discount)
                                  order_items   ──────────→ orders

mold_types ←── molds (total_grams, wax_grams — calculadora)

calculation_presets ←── calculation_preset_items (product_id, grams, unit_abbr, fragrance_pct)
  (includes_color, labor_cost, labor_hours)
```

---

## API — Endpoints principales

Prefijo base: `/api` | Auth: `Authorization: Bearer <token>`

| Recurso | Rutas |
|---|---|
| Auth | `POST /auth/login` · `POST /auth/register` · `GET /auth/me` · `POST /auth/change-password` |
| Usuarios | `GET/POST/PUT/DELETE /users` (solo admin) |
| Categorías | `GET/POST/PUT/DELETE /categories` |
| Unidades | `GET/POST/PUT/DELETE /units` |
| Productos | `GET/POST/PUT/DELETE /products` · `GET /products/stock/pdf` |
| Stock | `PATCH /products/:id/stock` · `PATCH /products/:id/writeoff` · `POST /products/inventory-count` |
| Tipos de molde | `GET/POST/PUT/DELETE /mold-types` |
| Moldes | `GET/POST/PUT/DELETE /molds` · `GET /molds/pdf` |
| Clientes | `GET/POST/PUT/DELETE /clients` |
| Proformas | `GET/POST/PUT /proformas` · `POST /:id/confirm` · `POST /:id/cancel` · `GET /:id/pdf` |
| Órdenes | `GET /orders` · `GET /orders/:id` |
| Calculadora / Presets | `GET/POST/PUT/DELETE /presets` |
| Reportes | `GET /reports/summary` · `/orders` · `/low-stock` · `/top-clients` · `/pdf` |
| Configuración | `GET/PUT /settings` · `POST /settings/logo` |

---

## Respuesta estándar

```json
{ "ok": true, "message": "OK", "data": {} }
```

---

## Resetear contraseña desde consola

```bash
node -e "
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');
bcrypt.hash('NUEVA_CONTRASEÑA', 10).then(hash => {
  return pool.query('UPDATE users SET password = ? WHERE username = ?', [hash, 'USERNAME_DEL_USUARIO']);
}).then(([r]) => {
  console.log('Filas actualizadas:', r.affectedRows);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"
```

Para ver los usuarios registrados:
```bash
node -e "
const { pool } = require('./src/config/database');
pool.query('SELECT id, name, username, role FROM users').then(([r]) => { console.table(r); process.exit(0); });
"
```

---

## Variables de entorno

| Variable | Descripción | Default |
|---|---|---|
| `PORT` | Puerto del backend | `3000` |
| `DB_HOST` | Host MySQL | `localhost` |
| `DB_PORT` | Puerto MySQL | `3306` |
| `DB_USER` | Usuario MySQL | — |
| `DB_PASSWORD` | Contraseña MySQL | — |
| `DB_NAME` | Nombre de la DB | `candles_db` |
| `JWT_SECRET` | Clave secreta JWT | — |
| `JWT_EXPIRES` | Duración del token | `8h` |
| `CORS_ORIGIN` | URL del frontend | `http://localhost:4200` |
