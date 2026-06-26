# Candles App — Sistema de gestión para negocio de velas artesanales

Sistema completo de gestión para producción y venta de velas artesanales. Permite administrar productos (cera, esencia, pabilos, etc.), moldes, clientes, cotizaciones, pedidos, devoluciones e inventario.

## Stack tecnológico

- **Backend:** Node.js + Express + MySQL (puerto 3000)
- **Frontend:** Angular 16 SPA (puerto 4200)
- **PDF:** pdfkit
- **Auth:** JWT (basado en username, no email)

---

## Requisitos previos

- Node.js 18+
- MySQL 8+
- npm

---

## Instalación

### 1. Clonar y configurar entorno

```bash
git clone <repo-url>
cd candles-app
cp .env.example .env
```

Editar `.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=candles_db
PORT=3000
CORS_ORIGIN=http://localhost:4200
JWT_SECRET=tu_clave_secreta
JWT_EXPIRES=8h
```

### 2. Instalar dependencias

```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

### 3. Inicializar base de datos

**Opcion recomendada — un solo comando:**
```bash
npm run db:migrate-all
```

Esto corre las 18 migraciones en orden. Es seguro de re-ejecutar (cada migracion verifica si la columna/tabla ya existe antes de crearla).

**Si cambias de ambiente y tenes datos que preservar:**
```bash
npm run db:reset
```
Hace backup JSON → drop de tablas → migraciones desde cero → restaura datos.

**Migraciones individuales (referencia):**
```bash
npm run db:migrate                      # Schema base
node src/config/migrate-v2.js           # Modelo de velas: molds, labor_cost, items libres
node src/config/migrate-cedula.js       # cedula en clients
node src/config/migrate-settings.js     # business_settings
node src/config/migrate-presets.js      # calculation_presets + updated_at
node src/config/migrate-mold-types.js   # mold_types + mold_type_id en molds
node src/config/migrate-fragrance.js    # is_fragrance en categories
node src/config/migrate-presets-v2.js   # includes_color, fragrance_pct
node src/config/migrate-presets-v3.js   # labor_cost en presets
node src/config/migrate-presets-v4.js   # labor_hours en presets
node src/config/migrate-username.js     # username en users
node src/config/migrate-report-logo.js  # report_logo_path en settings
node src/config/migrate-mold-type-image.js  # image_path en mold_types
node src/config/migrate-mold-image.js       # image_path en molds
node src/config/migrate-product-image.js    # image_path en products
node src/config/migrate-delivery.js     # delivery_date/status + orders.status ENUM ampliado
node src/config/migrate-returns.js      # order_returns + order_return_items
node src/config/migrate-order-items-v2.js   # preset_id + is_service en order_items
```

### 4. Iniciar servidores

```bash
# Backend (desarrollo con auto-reload)
npm run dev

# Frontend (en otra terminal)
cd frontend && npm start
```

Abrir `http://localhost:4200` en el navegador.

---

## Funcionalidades

### Autenticacion
- Login y registro con `username` (no email)
- JWT con duracion configurable (default 8h)
- Roles: `admin` y `user`
- Cambio de contrasena desde el topbar

### Configuracion del negocio
- Nombre, RUC, telefono
- **Logo icono**: aparece en login, sidebar y favicon
- **Logo de PDFs**: aparece en el encabezado de todos los PDFs (fallback al logo icono si no esta configurado)

### Productos (Ingredientes)
- CRUD completo con categorias y unidades de medida
- Stock con minimo configurable (`min_stock`)
- Imagen referencial por producto
- Exportacion a PDF

### Gestion de stock
- **Agregar stock**: suma cantidad al stock actual
- **Dar de baja**: resta cantidad (ej: material danado)
- **Toma de inventario**: modo bulk — se ingresan cantidades reales, el sistema calcula diferencias

### Categorias
- Flag `is_fragrance`: los productos de estas categorias activan el campo de % fragancia en la calculadora

### Moldes y tipos de molde
- **Tipos de molde**: clasificacion con imagen referencial
- **Moldes**: `total_grams` (peso agua por desplazamiento), `wax_grams` auto-calculado (`total_grams x 0.90 x 1.05`)
- Imagen referencial por molde y tipo de molde

### Calculadora de costos
- Selecciona molde e ingredientes
- Auto-llena cera segun `wax_grams` del molde
- **% Fragancia**: para productos de categoria `is_fragrance`, calcula `ml = wax_grams x pct/100` y reduce la linea de cera
- **Mano de obra**: tarifa (S//h) x horas
- **Color**: checkbox que suma S/ 0.10 por vela
- Calcula costo total, ganancia y margen dado un precio de venta
- Los calculos se guardan como **presets** reutilizables en proformas
- Exportacion a PDF con todos los costos (ingredientes + mano de obra + color)

### Clientes
- CRUD con nombre, CI/RUC, correo, telefono, direccion y notas

### Proformas (Cotizaciones)
- Items libres (descripcion manual) o vinculados a presets de calculadora
- Descuento global
- **Fecha de entrega** (opcional): se muestra en el PDF y se copia a la orden al confirmar
- PDF incluye datos del cliente (nombre, CI/RUC, telefono, direccion)
- Estados: `borrador` -> `confirmada` / `cancelada`

### Ordenes (Pedidos)
- Se crean exclusivamente al confirmar una proforma
- **Estado de entrega**: toggle switch `pendiente` / `entregado`
- **Estado de devolucion**: `anulado parcial` / `anulado total` (calculado automaticamente)
- Exportacion a PDF con columnas de fecha y estado de entrega

#### Devoluciones
- Devolucion parcial o total desde el detalle de la orden
- Seleccion de cantidad a devolver por item
- **Restauracion de stock inteligente**:
  - **Productos directos**: restaura el stock del producto segun la unidad nativa
  - **Presets de calculadora**: restaura cada ingrediente del preset proporcionalmente
  - **Servicios**: no se pueden devolver
- Historial de devoluciones con fecha, notas y detalle de stock restaurado
- La orden pasa automaticamente a `anulado parcial` o `anulado total` segun corresponda

### Filtros en listados

Todos los listados tienen filtros server-side. El PDF descargado respeta siempre los filtros activos.

| Modulo | Filtros disponibles |
|--------|---------------------|
| Categorias | Nombre |
| Unidades | Nombre o abreviatura (mismo campo) |
| Tipos de molde | Nombre |
| Moldes | Nombre/descripcion + tipo de molde (combo) |
| Productos | Nombre + categoria (combo) + unidad (combo) |
| Stock | Nombre + categoria (combo) + unidad (combo) |
| Clientes | Nombre + cedula/RUC |
| Proformas | Cliente + estado (combo) + rango de fechas |
| Ordenes | Cliente + estado entrega + estado devolucion + rango de fechas |

### Reportes
- KPIs: total ordenes, ingresos, clientes activos, proformas pendientes, productos con stock bajo
- Ordenes por periodo con filtro de fechas
- Stock bajo (productos donde `stock <= min_stock`)
- Top 10 clientes por volumen de compra
- Exportacion completa a PDF

---

## API REST

Base URL: `http://localhost:3000/api`

Todas las respuestas usan: `{ ok, message, data?, errors? }`

### Auth (publico)
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| POST | `/auth/login` | `{ username, password }` -> `{ user, token }` |
| POST | `/auth/register` | `{ username, name, password }` -> `{ user, token }` |
| GET | `/auth/me` | Perfil del usuario autenticado |
| POST | `/auth/change-password` | `{ current_password, new_password }` |

### Proformas
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/proformas` | Listar proformas |
| POST | `/proformas` | Crear proforma |
| GET | `/proformas/:id` | Detalle |
| PUT | `/proformas/:id` | Actualizar |
| DELETE | `/proformas/:id` | Cancelar |
| POST | `/proformas/:id/confirm` | Confirmar -> crea orden |
| GET | `/proformas/:id/pdf` | PDF de la proforma |

### Ordenes
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/orders` | Listar ordenes |
| GET | `/orders/:id` | Detalle de la orden |
| GET | `/orders/pdf` | PDF del listado |
| PATCH | `/orders/:id/delivery-status` | Cambiar estado de entrega |
| GET | `/orders/:id/returns` | Historial de devoluciones |
| POST | `/orders/:id/returns` | Registrar devolucion |

**Body para devolucion:**
```json
{
  "notes": "Motivo opcional",
  "items": [
    {
      "order_item_id": 1,
      "quantity": 2,
      "restores_stock": true
    }
  ]
}
```

### Reportes
| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/reports/summary` | KPIs del negocio |
| GET | `/reports/orders?from=&to=` | Ordenes por periodo |
| GET | `/reports/low-stock` | Productos con stock bajo |
| GET | `/reports/top-clients` | Top 10 clientes |
| GET | `/reports/pdf?from=&to=` | PDF completo |

---

## Logica de negocio critica

### Confirmacion de proforma (`Proforma.confirm()`)
Transaccion que:
1. Verifica stock suficiente para todos los items con producto o preset
2. Crea el registro de orden
3. Copia items de proforma -> orden (con `preset_id` y flag `is_service`)
4. Descuenta stock convirtiendo gramos a unidad nativa del producto
5. Marca los presets usados como inactivos
6. Rollback completo ante cualquier falla

### Formula de cera
```
wax_grams = total_grams x 0.90 x 1.05
```
Donde `total_grams` es el peso del agua al llenar el molde por desplazamiento.

---

## Comandos de base de datos

| Comando | Descripcion |
|---------|-------------|
| `npm run db:migrate` | Schema base (primera vez) |
| `npm run db:migrate-all` | Corre las 18 migraciones en orden, seguro de re-ejecutar |
| `npm run db:reset` | Backup → drop → migraciones → restore (cambio de ambiente) |
| `npm run db:restore <archivo.json>` | Restaura datos desde un backup JSON |

## Notas de desarrollo

- No hay test runner ni linter configurados
- Los deletes de Categories, Products, Molds, MoldTypes y Clients son **logicos** (`is_active = 0`)
- Las imagenes se guardan en `public/uploads/` con nombres predecibles (`product-{id}.ext`, etc.)
- El token JWT se incluye en todas las peticiones via HTTP interceptor en Angular
- Los filtros de listado usan queries parametrizadas — no hay riesgo de SQL injection
- El PDF de cada listado respeta los filtros activos (mismos query params que el listado)
