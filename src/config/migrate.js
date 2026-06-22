/**
 * Ejecuta: node src/config/migrate.js
 * Crea todas las tablas si no existen.
 */
require('dotenv').config();
const { pool } = require('./database');

const SQL = `
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  role       ENUM('admin','user') NOT NULL DEFAULT 'user',
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  is_active   TINYINT(1) NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS units (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(50)  NOT NULL UNIQUE,  -- Ej: gramos, kilogramos, unidad, litros
  abbreviation VARCHAR(10)  NOT NULL,          -- Ej: g, kg, u, l
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  category_id INT           NOT NULL,
  unit_id     INT           NOT NULL,
  name        VARCHAR(150)  NOT NULL,
  description TEXT,
  price       DECIMAL(10,2) NOT NULL,          -- precio por unidad/medida definida
  stock       DECIMAL(12,3) NOT NULL DEFAULT 0, -- stock en la unidad definida
  min_stock   DECIMAL(12,3) NOT NULL DEFAULT 0, -- alerta de stock mínimo
  is_active   TINYINT(1)    NOT NULL DEFAULT 1,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
  FOREIGN KEY (unit_id)     REFERENCES units(id)      ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS clients (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  email      VARCHAR(150),
  phone      VARCHAR(20),
  address    TEXT,
  notes      TEXT,
  is_active  TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Proforma: calculadora antes de confirmar
CREATE TABLE IF NOT EXISTS proformas (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  client_id   INT           NOT NULL,
  notes       TEXT,
  subtotal    DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount    DECIMAL(10,2) NOT NULL DEFAULT 0, -- valor absoluto de descuento
  total       DECIMAL(10,2) NOT NULL DEFAULT 0,
  status      ENUM('borrador','confirmada','cancelada') NOT NULL DEFAULT 'borrador',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT
);

-- Líneas de la proforma
CREATE TABLE IF NOT EXISTS proforma_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  proforma_id  INT           NOT NULL,
  product_id   INT           NOT NULL,
  quantity     DECIMAL(12,3) NOT NULL,
  unit_price   DECIMAL(10,2) NOT NULL, -- precio al momento de agregar
  subtotal     DECIMAL(10,2) NOT NULL, -- quantity * unit_price
  FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE RESTRICT
);

-- Pedido/venta confirmado — se genera al confirmar una proforma
CREATE TABLE IF NOT EXISTS orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  proforma_id  INT           NOT NULL UNIQUE, -- 1 orden por proforma
  client_id    INT           NOT NULL,
  notes        TEXT,
  subtotal     DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount     DECIMAL(10,2) NOT NULL DEFAULT 0,
  total        DECIMAL(10,2) NOT NULL DEFAULT 0,
  status       ENUM('pendiente','entregado','cancelado') NOT NULL DEFAULT 'pendiente',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (proforma_id) REFERENCES proformas(id) ON DELETE RESTRICT,
  FOREIGN KEY (client_id)   REFERENCES clients(id)   ON DELETE RESTRICT
);

-- Líneas del pedido (copia de la proforma al momento de confirmar)
CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT           NOT NULL,
  product_id  INT           NOT NULL,
  quantity    DECIMAL(12,3) NOT NULL,
  unit_price  DECIMAL(10,2) NOT NULL,
  subtotal    DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id)   REFERENCES orders(id)   ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT
);

-- Datos base: unidades de medida
INSERT IGNORE INTO units (name, abbreviation) VALUES
  ('Unidad',      'u'),
  ('Gramos',      'g'),
  ('Kilogramos',  'kg'),
  ('Mililitros',  'ml'),
  ('Litros',      'l'),
  ('Onzas',       'oz'),
  ('Libras',      'lb');

-- Categorías de ejemplo
INSERT IGNORE INTO categories (name, description) VALUES
  ('Velas',         'Velas artesanales de todo tipo'),
  ('Fragancias',    'Aceites esenciales y aromas'),
  ('Materias primas', 'Cera, mechas, colorantes, etc.'),
  ('Empaques',      'Cajas, bolsas y presentaciones');
`;

async function migrate() {
  const conn = await pool.getConnection();
  try {
    for (const stmt of SQL.split(';').map(s => s.trim()).filter(Boolean)) {
      await conn.query(stmt);
    }
    console.log('✅ Migración completada');
  } catch (err) {
    console.error('❌ Error en migración:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
