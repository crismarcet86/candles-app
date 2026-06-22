# 🕯️ Candles App

Sistema de gestión para un emprendimiento de velas artesanales. Permite gestionar ingredientes (cera, esencia, pabilos), moldes, clientes, cotizaciones (proformas) con mano de obra y descuentos, confirmar pedidos descontando stock, calcular costos y exportar reportes en PDF.

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

### 5. Inicializar la base de datos
```bash
npm run db:migrate
node src/config/migrate-v2.js
node src/config/migrate-cedula.js
```

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
│   │   └── migrate-cedula.js  # Agrega cédula a clientes
│   ├── models/                # Queries SQL directas
│   ├── controllers/           # Manejo de req/res
│   ├── routes/                # Rutas + validaciones
│   ├── middlewares/           # auth, errorHandler, validate
│   └── utils/                 # logger, response, pdfProforma, pdfReport
├── frontend/                  # Angular 16 SPA
│   └── src/app/modules/
│       ├── auth/              # Login y registro
│       ├── dashboard/         # Inicio con accesos rápidos
│       ├── products/          # Ingredientes (cera, esencia, pabilo…)
│       ├── molds/             # Moldes con capacidad en gramos
│       ├── clients/           # Clientes
│       ├── proformas/         # Cotizaciones → PDF
│       ├── orders/            # Pedidos confirmados
│       ├── calculator/        # Calculadora de costos con margen
│       └── reports/           # Reportes KPI + PDF exportable
├── .env.example
├── .gitignore
└── package.json
```

---

## Modelo de datos

```
users (autenticación y roles)

categories ←── products (ingredientes) ───→ units
                        │
                 proforma_items ──────────→ proformas ───→ clients
                        │                    (labor_cost, discount)
                  order_items   ──────────→ orders

molds (capacidad en gramos — usados en calculadora)
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
| Productos | `GET/POST/PUT/DELETE /products` |
| Moldes | `GET/POST/PUT/DELETE /molds` |
| Clientes | `GET/POST/PUT/DELETE /clients` |
| Proformas | `GET/POST/PUT /proformas` · `POST /:id/confirm` · `GET /:id/pdf` |
| Órdenes | `GET /orders` · `GET /orders/:id` |
| Reportes | `GET /reports/summary` · `/orders` · `/low-stock` · `/top-clients` · `/pdf` |

---

## Respuesta estándar

```json
{ "ok": true, "message": "OK", "data": {} }
```

---

## Resetear contraseña desde consola

Desde la raíz del proyecto (con el `.env` configurado):

```bash
node -e "
const bcrypt = require('bcryptjs');
const { pool } = require('./src/config/database');
bcrypt.hash('NUEVA_CONTRASEÑA', 10).then(hash => {
  return pool.query('UPDATE users SET password = ? WHERE email = ?', [hash, 'EMAIL_DEL_USUARIO']);
}).then(([r]) => {
  console.log('Filas actualizadas:', r.affectedRows);
  process.exit(0);
}).catch(e => { console.error(e.message); process.exit(1); });
"
```

Reemplazá `NUEVA_CONTRASEÑA` y `EMAIL_DEL_USUARIO` con los valores reales.

Para ver los usuarios registrados:
```bash
node -e "
const { pool } = require('./src/config/database');
pool.query('SELECT id, email, role FROM users').then(([r]) => { console.table(r); process.exit(0); });
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
