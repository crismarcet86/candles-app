# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sistema de gestión para negocio de **velas artesanales**. Permite gestionar ingredientes (cera, esencia, pabilos, etc.), tipos de molde, moldes con capacidad en gramos, clientes, cotizaciones (proformas) con descuentos, confirmar pedidos descontando stock, calcular costos con % de fragancia, color y mano de obra (tarifa × horas), y ajustar inventario.

- **Backend:** Node.js + Express + MySQL REST API (`/` — puerto 3000)
- **Frontend:** Angular 16 SPA (`/frontend/` — puerto 4200)

## Commands

```bash
# Backend (raíz del proyecto)
npm run dev        # Development server con nodemon (auto-reload) → puerto 3000
npm start          # Production server
npm run db:migrate # Inicializa schema y datos semilla (ejecutar una vez)

# Migraciones adicionales (ejecutar en orden si es instalación nueva)
node src/config/migrate-v2.js          # Adapta DB al modelo de velas: molds, labor_cost, items libres
node src/config/migrate-cedula.js      # Agrega campo cedula a clients
node src/config/migrate-settings.js    # Tabla business_settings (nombre, RUC, teléfono, logo)
node src/config/migrate-presets.js     # Tablas calculation_presets + preset_id en proforma_items
node src/config/migrate-mold-types.js  # Tabla mold_types + total_grams + mold_type_id en molds
node src/config/migrate-presets-v2.js  # includes_color en presets; fragrance_pct en preset_items
node src/config/migrate-presets-v3.js  # labor_cost en calculation_presets
node src/config/migrate-presets-v4.js  # labor_hours en calculation_presets (default 1)
node src/config/migrate-username.js    # Columna username en users (reemplaza email para login)
node src/config/migrate-report-logo.js # Columna report_logo_path en business_settings para imagen de PDFs

# Columnas agregadas con ALTER TABLE directo (sin script):
#   categories.is_fragrance TINYINT(1) DEFAULT 0

# Frontend (carpeta /frontend)
cd frontend && npm start      # Angular dev server → puerto 4200
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
    database.js        # mysql2 connection pool
    migrate.js         # Schema inicial + seeding
    migrate-v2.js      # Adapta al modelo de velas: molds, labor_cost, items opcionales
    migrate-cedula.js  # Agrega cedula a clients
    migrate-settings.js  # Tabla business_settings
    migrate-presets.js   # Tablas calculation_presets y calculation_preset_items
    migrate-mold-types.js # Tabla mold_types + columnas en molds
    migrate-presets-v2.js # includes_color en presets; fragrance_pct en preset_items
    migrate-presets-v3.js # labor_cost en calculation_presets
    migrate-presets-v4.js # labor_hours en calculation_presets
    migrate-username.js   # Agrega username NOT NULL UNIQUE a users; poblado desde prefijo de email
    migrate-report-logo.js # Agrega report_logo_path a business_settings
  routes/            # Definición de rutas con reglas express-validator
  controllers/       # Manejo de request/response HTTP
  models/            # Queries SQL crudas (sin ORM), lógica transaccional
    Report.js        # getSummary, getOrdersByPeriod, getLowStock, getTopClients
    CalculationPreset.js # CRUD de presets de calculadora
    MoldType.js      # CRUD de tipos de molde
  middlewares/
    auth.js          # requireAuth (JWT) y requireAdmin (role check)
    errorHandler.js  # Captura global de errores → JSON estandarizado
    validate.js      # Verificador de express-validator → 400 en error
  utils/
    logger.js        # Winston logger
    response.js      # Helpers: success(), created(), error(), notFound(), badRequest()
    pdfProforma.js   # Generador PDF de proformas con pdfkit (incluye datos del cliente)
    pdfReport.js     # Generador PDF de reportes: KPIs, órdenes, stock bajo, top clientes
    pdfList.js       # Generador genérico de listados en PDF (generateListPDF)
    pdfHeader.js     # Encabezado común con logo y nombre del negocio
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
    categories/           # CRUD de categorías; flag is_fragrance controla % fragancia en calculadora
    units/                # CRUD de unidades de medida
    products/             # CRUD de ingredientes (precio, stock, min_stock)
    stock/                # Stock: agregar, dar de baja (daño), toma de inventario bulk
    clients/              # CRUD de clientes (nombre, cédula, correo, teléfono, dirección)
    proformas/            # Cotizaciones: items libres + presets + descuento → PDF
    orders/               # Pedidos confirmados (solo lectura)
    mold-types/           # CRUD de tipos de molde
    molds/                # CRUD de moldes: tipo, peso agua, cera (auto 90%×1.05)
    calculator/           # Calculadora: molde + ingredientes + % fragancia + color + mano de obra
    reports/              # Reportes: KPIs, órdenes por período, stock bajo, top clientes + PDF
  shared/
    models/               # Interfaces TypeScript: Client, Product, Proforma, Mold, MoldType, etc.
```

**Rutas Angular (`/dashboard/...`):**
- `` (raíz) — dashboard con resumen
- `users` — gestión de usuarios (solo admin)
- `categories` — categorías de ingredientes (con flag fragancia)
- `units` — unidades de medida
- `products` — ingredientes (cera, esencia, pabilo, etc.)
- `stock` — inventario: agregar / dar de baja / toma de inventario
- `mold-types` — tipos de molde
- `molds` — moldes con agua/cera en gramos
- `clients` — clientes
- `proformas` — cotizaciones / proformas
- `orders` — pedidos (solo lectura)
- `calculator` — calculadora de costos de velas
- `reports` — reportes gerenciales con PDF exportable

## Domain Model

```
users (autenticación y roles)

categories (is_fragrance) ←── products (ingredientes) ───→ units
                                        │
                                 proforma_items ──────────→ proformas ───→ clients
                                        │   (preset_id?)     (discount)
                                  order_items   ──────────→ orders

mold_types ←── molds (total_grams agua, wax_grams = agua×0.9×1.05)

calculation_presets ←── calculation_preset_items
  (includes_color, labor_cost, labor_hours)   (product_id, grams, unit_abbr, is_unit, fragrance_pct)
```

- **User** tiene `username` (único, reemplaza email para login), `role`: `admin` o `user`. Solo admins gestionan usuarios
- **Category** tiene `is_fragrance` — si es 1, sus ingredientes muestran el campo % fragancia en la calculadora
- **Product** (ingrediente) hereda `is_fragrance` de su categoría vía JOIN; `price`, `stock`, `min_stock`
- **MoldType** — clasificación del molde (ej: "Redondo", "Cuadrado")
- **Mold** tiene `total_grams` (peso agua por desplazamiento) y `wax_grams` (auto = agua×0.9×1.05)
- **Client** tiene `cedula` (CI/RUC), `email`, `phone`, `address`, `notes`
- **ProformaItem** tiene descripción libre (texto), cantidad y precio unitario manual — `product_id` opcional; `preset_id` opcional (vincula un preset de calculadora)
- **Proforma** tiene `discount`, `status`: `borrador` → `confirmada` / `cancelada`. La mano de obra ya no está en proforma — se gestiona en el preset de calculadora
- **Order** se crea exclusivamente al confirmar una Proforma — nunca directamente
- **CalculationPreset** guarda un cálculo completo (molde, ingredientes con gramos, % fragancia, color, mano de obra tarifa/h y horas, precio de venta) reutilizable en proformas

## Critical Business Logic

`Proforma.confirm()` en `src/models/Proforma.js` es la transacción central:
1. Verifica stock para ítems con `product_id` directo (convierte unidades vía `gramsToNativeUnit`)
2. Verifica stock para ingredientes de presets vinculados (`preset_id`): convierte grams → unidad nativa del producto (kg, lb, oz, g…)
3. Crea el registro de Order
4. Copia proforma_items → order_items (con `description` del item, no `product_name`)
5. Descuenta stock (con conversión de unidades)
6. Marca los presets usados como `is_active = 0`
7. Rollback completo ante cualquier falla

**Conversión de unidades en `Proforma.js`:**
```javascript
function gramsToNativeUnit(grams, unitAbbr) {
  switch (unitAbbr.toLowerCase()) {
    case 'kg': return grams / 1000;
    case 'lb': return grams / 453.592;
    case 'oz': return grams / 28.3495;
    default:   return grams; // g, ml, u, etc.
  }
}
```
Los `grams` en `calculation_preset_items` siempre son gramos reales. La conversión se aplica al comparar/descontar contra el stock en unidad nativa del producto.

**La proforma NO descuenta stock** — solo lo hace la confirmación.

Stock siempre usa columnas `DECIMAL` (nunca float) para evitar errores de redondeo.

**Calculadora de costos** (`/dashboard/calculator`):
- Carga moldes activos e ingredientes activos
- Al seleccionar un molde, la línea de cera se auto-llena con `wax_grams`
- Soporta ingredientes en `kg` → costo por gramo = `price / 1000`; en `ml` → costo por ml = `price`; por unidad (pabilos)
- **% Fragancia**: aparece en líneas cuyo ingrediente tiene `is_fragrance = 1` (vía categoría), independientemente de la unidad. Al ingresar %, calcula `ml = mold.wax_grams × pct/100` y reduce la línea de cera automáticamente
- **Mano de obra**: campo tarifa (S//h) × campo horas = `laborTotal`; se suma al `totalCostPerCandle`
- **Incluye color**: checkbox que suma S/ 0.10 al costo por vela
- Calcula costo total, ganancia y margen dados un precio de venta
- Los cálculos se guardan como presets (incluyendo `labor_cost`, `labor_hours`, `includes_color`, `fragrance_pct` por línea) y se pueden cargar/modificar en cualquier momento

**Stock** (`/dashboard/stock`):
- **Agregar stock**: suma cantidad al stock actual
- **Dar de baja** (`PATCH /:id/writeoff`): resta cantidad (ej: material dañado)
- **Toma de inventario** (`POST /products/inventory-count`): modo bulk — ingresás el stock real contado, el sistema calcula la diferencia y actualiza solo los ítems completados

## Molds — Fórmula de cera

- Campo: **"Peso total de agua (g)"** (`total_grams`) — peso del agua al llenar el molde (método de desplazamiento)
- Fórmula auto: `wax_grams = total_grams × 0.90 × 1.05`
- Razón: densidad de cera ≈ 90% del agua + 5% de margen adicional

## PDF de Proformas y Reportes

- `GET /api/proformas/:id/pdf` — PDF individual de proforma (pdfkit). El frontend usa `<a href>` directo.
  - Incluye datos del cliente: nombre, CI/RUC, teléfono y dirección (si existen)
  - El subtotal muestra ítems + mano de obra absorbida; "Mano de obra" no aparece como línea separada
- `GET /api/reports/pdf?from=YYYY-MM-DD&to=YYYY-MM-DD` — PDF de reporte gerencial. El frontend hace petición HTTP con blob download.
- `GET /api/products/stock/pdf` — PDF del reporte de stock (requiere auth, blob download).
- Listados PDF (categorías, moldes, etc.) usan `generateListPDF` de `src/utils/pdfList.js`.

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

## Configuración del Negocio

- `GET/PUT /api/settings` — nombre del negocio, RUC, teléfono, logo (ruta pública — no requiere auth)
- **Logo icono** (`POST /api/settings/logo`): guarda `logo.<ext>` en `public/uploads/`; aparece en login, sidebar y favicon del tab.
- **Logo de PDFs** (`POST /api/settings/report-logo`): guarda `report-logo.<ext>` en `public/uploads/`; aparece en el encabezado de todos los PDFs. Si no está configurado, hace fallback al logo icono.
- El `businessName` también se guarda en `localStorage` bajo `candles_business_name` para el topbar
- Todos los controllers de PDF usan `settings.report_logo_path || settings.logo_path` como `logoPath`

## Validaciones Frontend

- **Campos numéricos** (`type="number"`): bloquean teclas `e`, `E`, `+`, `-` con `(keydown)` para evitar notación científica
- **Campos de correo** (solo clientes): usan `Validators.pattern(/^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/)` en el formulario de clientes
- **Campo username**: solo `Validators.required` (sin formato de email) — en login, registro y gestión de usuarios

## Estilos globales — Patrones CSS

- `styles.css` usa `!important` para overrides globales sobre ViewEncapsulation de Angular
- `.header-actions { display: flex; gap: 0.5rem; }` — patrón de botones en encabezado de todas las páginas de listado
- `font-size: 15px` base (compacto)
- `.btn-primary`, `.btn-outline`, `.btn-danger` con padding compacto via `!important`

## Responsive / Layout

- **Sidebar en móvil** (`< 768px`): overlay full-screen (`width: 100vw`), se abre/cierra con el botón ☰ del topbar o el ✕ interno del sidebar
- **Backdrop**: `layout.component` renderiza un `.sidebar-backdrop` semi-transparente cuando el sidebar está abierto en móvil — hacer clic lo cierra
- **Auto-cierre**: `LayoutComponent` suscribe a `Router.events` (NavigationEnd) y cierra el sidebar al navegar en móvil
- **`isMobile`**: se calcula con `window.innerWidth < 768` y se actualiza en `window:resize`
- **CSS global responsive** (`styles.css`): `.form-row` colapsa a 1 columna, `.page-header` se apila, `.form-actions` se invierte (botón primario arriba) en móvil

## API Conventions

- Todas las rutas llevan prefijo `/api`
- Todas las respuestas usan la forma: `{ ok, message, data?, errors? }`
- Deletes de Categories, Products, Molds, MoldTypes y Clients son **lógicos** (`is_active = 0`)
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
El payload del token contiene: `{ id, username, role, name }`

## Key Patterns

- Los modelos aceptan parámetro opcional `conn` para participar en transacciones (ej: `Product.adjustStock(delta, conn)`)
- Las reglas de validación viven en los archivos de rutas junto a las definiciones de rutas
- El middleware `errorHandler` debe registrarse último en `app.js`
- `requireAuth` y `requireAdmin` en `src/middlewares/auth.js` son los guards del backend
- El frontend guarda el token en `localStorage` y lo inyecta via HTTP interceptor
- `AuthService.businessName` se guarda en `localStorage` bajo la clave `candles_business_name` — editable desde el topbar
- Las descripciones de ítems de proforma/orden se leen de `item.description`, no de `item.product_name` (que puede ser null para ítems libres)
- `Proforma.findById` retorna `client_cedula`, `client_phone` y `client_address` además de `client_name` para el PDF
- La autenticación usa `username` (no email): `User.findByUsername()`, `POST /auth/login` recibe `{ username, password }`
