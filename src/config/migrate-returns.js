/**
 * migrate-returns.js
 * Crea tablas order_returns y order_return_items para devoluciones parciales/totales.
 * Ejecutar una vez: node src/config/migrate-returns.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_returns (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        order_id   INT NOT NULL,
        notes      VARCHAR(500) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (order_id) REFERENCES orders(id)
      )
    `);
    console.log('✔ Tabla order_returns lista');

    await conn.query(`
      CREATE TABLE IF NOT EXISTS order_return_items (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        return_id       INT NOT NULL,
        order_item_id   INT NOT NULL,
        product_id      INT NULL,
        description     VARCHAR(500) NULL,
        quantity        DECIMAL(10,4) NOT NULL,
        restores_stock  TINYINT(1) NOT NULL DEFAULT 1,
        FOREIGN KEY (return_id)     REFERENCES order_returns(id),
        FOREIGN KEY (order_item_id) REFERENCES order_items(id)
      )
    `);
    console.log('✔ Tabla order_return_items lista');

    console.log('\n✅ migrate-returns completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
