# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de gestión para negocio de **velas artesanales**. Permite gestionar ingredientes (cera, esencia, pabilos, etc.), moldes con capacidad en gramos, clientes, cotizaciones (proformas) con mano de obra y descuentos, y confirmar pedidos descontando stock.

- **Backend:** Node.js + Express + MySQL REST API (`/` — puerto 3000)
- **Frontend:** Angular 16 SPA (`/frontend/` — puerto 4200)

## Commands

```bash
# Backend (raíz del proyecto)
npm run dev        # Development server con nodemon (auto-reload) → puerto 3000
npm start          # Production server
npm run db:migrate # Inicializa schema y datos semilla (ejecutar una vez)

# Migraciones adicionales (ejecutar en orden si es instalación nueva)
node src/config/migrate-v2.js      # Adapta DB al modelo de velas: molds, labor_cost, items libres
node src/config/migrate-cedula.js  # Agrega campo cedula a clients

# Frontend (carpeta /frontend)
cd frontend && npm start   # Angular dev server → puerto 4200
cd frontend && npm run build  # Build de producción
```

No hay test runner ni linter configurado en ninguno de los dos proyectos.

## Environment Setup

Copiar `.env.example` a `.env` y configurar:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` — conexión MySQL
- `PORT` — por defecto 3000
- `CORS_ORIGIN` — URL del frontend Angular (http://localhost:4200)
- `JWT_SECRET` — clave secreta para firmar tokens JWT
- `JWT_EXPIRES` — duración del token (por defecto `8h`)
- `ANTHROPIC_API_KEY` — reservado para integración AI futura

## Backend Architecture

**Request flow:** `src/routes/` → `src/controllers/` → `src/models/` → MySQL

```
src/
  server.js          # Entry point: carga .env, prueba DB, inicia servidor
  app.js             # Express setup: CORS, JSON parsing, morgan, routes
  config/
    database.js      # mysql2 connection pool
    migrate.js       # Schema inicial + seeding
    migrate-v2.js    # Adapta al modelo de velas: molds, labor_cost, items opcionales
    migrate-cedula.js # Agrega cedula a clients
  routes/            # Definición de rutas con reglas express-validator
  controllers/       # Manejo de request/response HTTP
  models/            # Queries SQL crudas (sin ORM), lógica transaccional
    Report.js        # getSummary, getOrdersByPeriod, getLowStock, getTopClients
  middlewares/
    auth.js          # requireAuth (JWT) y requireAdmin (role check)
    errorHandler.js  # Captura global de errores → JSON estandarizado
    validate.js      # Verificador de express-validator → 400 en error
  utils/
    logger.js        # Winston logger
    response.js      # Helpers: success(), created(), error(), notFound(), badRequest()
    pdfProforma.js   # Generador PDF de proformas con pdfkit
    pdfReport.js     # Generador PDF de reportes: KPIs, órdenes, stock bajo, top clientes
```

## Frontend Architecture

Angular 16 SPA con lazy loading por módulo.

```
frontend/src/app/
  app-routing.module.ts   # Rutas raíz: /auth (NoAuthGuard) y /dashboard (AuthGuard)
  core/
    guards/
      auth.guard.ts       # Redirige a /auth/login si no hay token
      no-auth.guard.ts    # Redirige a /dashboard si ya está autenticado
      admin.guard.ts      # Restringe rutas a usuarios con role = admin
    services/
      auth.service.ts     # Login, registro, token storage, usuario actual, businessName
  modules/
    auth/                 # Login y registro — público
    dashboard/            # Inicio post-login con métricas básicas
    layout/               # Shell: sidebar + topbar, contiene rutas hijas
    users/                # CRUD de usuarios (solo admin)
    categories/           # CRUD de categorías de ingredientes
    units/                # CRUD de unidades de medida
    products/             # CRUD de ingredientes (precio, stock, min_stock)
    clients/              # CRUD de clientes (nombre, cédula, correo, teléfono, dirección)
    proformas/            # Cotizaciones: items libres + labor_cost + descuento → PDF
    orders/               # Pedidos confirmados (solo lectura)
    molds/                # CRUD de moldes con capacidad en gramos de cera
    calculator/           # Calculadora de costos: molde + ingredientes → precio sugerido
    reports/              # Reportes: KPIs, órdenes por período, stock bajo, top clientes + PDF
  shared/
    models/               # Interfaces TypeScript: Client, Product, Proforma, Mold, etc.
```

**Rutas Angular (`/dashboard/...`):**
- `` (raíz) — dashboard con resumen
- `users` — gestión de usuarios (solo admin)
- `categories` — categorías de ingredientes
- `units` — unidades de medida
- `products` — ingredientes (cera, esencia, pabilo, etc.)
- `clients` — clientes
- `proformas` — cotizaciones / proformas
- `orders` — pedidos (solo lectura)
- `molds` — moldes con capacidad en gramos
- `calculator` — calculadora de costos de velas
- `reports` — reportes gerenciales con PDF exportable

## Domain Model

```
users (autenticación y roles)

categories ←── products (ingredientes) ───→ units
                        │
                 proforma_items ──────────→ proformas ───→ clients
                        │                    (labor_cost, discount)
                  order_items   ──────────→ orders

molds (capacidad en gramos de cera — usados en calculadora)
```

- **User** tiene `role`: `admin` o `user`. Solo admins gestionan usuarios
- **Product** representa un **ingrediente** (cera, esencia, pabilo, etc.) con `price`, `stock`, `min_stock`
- **Mold** tiene `wax_grams` — cantidad de cera necesaria para llenarlo
- **Client** tiene `cedula` (CI/RUC), `email`, `phone`, `address`, `notes`
- **ProformaItem** tiene descripción libre (texto), cantidad y precio unitario manual — `product_id` es opcional (solo para ingredientes que descuentan stock)
- **Proforma** tiene `labor_cost` (mano de obra artesanal), `discount`, `status`: `borrador` → `confirmada` / `cancelada`
- **Order** se crea exclusivamente al confirmar una Proforma — nunca directamente

## Critical Business Logic

`Proforma.confirm()` en `src/models/Proforma.js` es la transacción central:
1. Verifica disponibilidad de stock para ítems con `product_id`
2. Crea el registro de Order
3. Copia proforma_items → order_items
4. Descuenta stock **solo** en ítems que tienen `product_id` (ingredientes reales)
5. Rollback completo ante cualquier falla

**La proforma NO descuenta stock** — solo lo hace la confirmación.

Stock siempre usa columnas `DECIMAL` (nunca float) para evitar errores de redondeo.

**Calculadora de costos** (`/dashboard/calculator`):
- Carga moldes activos e ingredientes activos
- Al seleccionar un molde, autocompleta gramos de cera
- Soporta ingredientes en `kg` → convierte a costo por gramo (`price / 1000`)
- Soporta ingredientes por unidad (pabilos)
- Calcula costo total, ganancia y margen dados un precio de venta

## PDF de Proformas y Reportes

- `GET /api/proformas/:id/pdf` — PDF individual de proforma (pdfkit). El frontend usa `<a href>` directo.
- `GET /api/reports/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD` — PDF de reporte gerencial. El frontend hace petición HTTP con blob download (los headers de auth se inyectan via interceptor).

## Reportes (`/api/reports/` — requiere `Bearer token`)

- `GET /summary` — 5 KPIs: total_orders, total_revenue, active_clients, pending_proformas, low_stock_count
- `GET /orders?from=&to=` — órdenes confirmadas filtradas por rango de fechas
- `GET /low-stock` — ingredientes donde `stock <= min_stock` (y `min_stock > 0`)
- `GET /top-clients` — top 10 clientes por total gastado en órdenes
- `GET /pdf?from=&to=` — PDF con todas las secciones anteriores

## Cambiar Contraseña

El topbar tiene un modal "Cambiar contraseña" (🔑) accesible desde el dropdown del usuario.
- Usa `POST /api/auth/change-password` con `{ current_password, new_password }`
- `AuthService.changePassword()` maneja la llamada HTTP
- El modal está inline en `topbar.component.html` con estado en `topbar.component.ts`

## Validaciones Frontend

- **Campos numéricos** (`type="number"`): bloquean teclas `e`, `E`, `+` con `(keydown)` para evitar notación científica
- **Campos de correo**: usan `Validators.pattern(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/)` en todos los formularios (login, registro, usuarios, clientes)

## Responsive / Layout

- **Sidebar en móvil** (`< 768px`): overlay full-screen (`width: 100vw`), se abre/cierra con el botón ☰ del topbar o el ✕ interno del sidebar
- **Backdrop**: `layout.component` renderiza un `.sidebar-backdrop` semi-transparente cuando el sidebar está abierto en móvil — hacer clic lo cierra
- **Auto-cierre**: `LayoutComponent` suscribe a `Router.events` (NavigationEnd) y cierra el sidebar al navegar en móvil
- **`isMobile`**: se calcula con `window.innerWidth < 768` y se actualiza en `window:resize`
- **CSS global responsive** (`styles.css`): `.form-row` colapsa a 1 columna, `.page-header` se apila, `.form-actions` se invierte (botón primario arriba) en móvil

## API Conventions

- Todas las rutas llevan prefijo `/api`
- Todas las respuestas usan la forma: `{ ok, message, data?, errors? }`
- Deletes de Categories, Products, Molds y Clients son **lógicos** (`is_active = 0`)
- Units usan hard delete
- Orders son solo lectura via API (se crean via `POST /api/proformas/:id/confirm`)
- `GET /health` retorna estado del sistema

## Auth & Users API

**Autenticación** (público):
- `POST /api/auth/login` — devuelve `{ user, token }`
- `POST /api/auth/register` — devuelve `{ user, token }`
- `GET /api/auth/me` — perfil del usuario autenticado (requiere `Bearer token`)
- `POST /api/auth/change-password` — cambio de contraseña (requiere `Bearer token`)

**Usuarios** (requiere `Bearer token` + role `admin`):
- `GET /api/users` — listar todos
- `GET /api/users/:id` — obtener uno
- `POST /api/users` — crear
- `PUT /api/users/:id` — actualizar
- `DELETE /api/users/:id` — desactivar (lógico)

El token JWT se incluye en el header: `Authorization: Bearer <token>`  
El payload del token contiene: `{ id, email, role, name }`

## Key Patterns

- Los modelos aceptan parámetro opcional `conn` para participar en transacciones (ej: `Product.adjustStock(delta, conn)`)
- Las reglas de validación viven en los archivos de rutas junto a las definiciones de rutas
- El middleware `errorHandler` debe registrarse último en `app.js`
- `requireAuth` y `requireAdmin` en `src/middlewares/auth.js` son los guards del backend
- El frontend guarda el token en `localStorage` y lo inyecta via HTTP interceptor
- `AuthService.businessName` se guarda en `localStorage` bajo la clave `candles_business_name` — editable desde el topbar
