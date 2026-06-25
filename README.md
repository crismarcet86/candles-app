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

Ejecutar migraciones en orden:

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
node src/config/migrate-mold-image.js
node src/config/migrate-product-image.js
node src/config/migrate-delivery.js
node src/config/migrate-returns.js
node src/config/migrate-order-items-v2.js
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

## Notas de desarrollo

- No hay test runner ni linter configurados
- Los deletes de Categories, Products, Molds, MoldTypes y Clients son **logicos** (`is_active = 0`)
- Las imagenes se guardan en `public/uploads/` con nombres predecibles (`product-{id}.ext`, etc.)
- El token JWT se incluye en todas las peticiones via HTTP interceptor en Angular
