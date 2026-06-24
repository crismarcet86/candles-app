/**
 * migrate-product-image.js
 * Agrega columna image_path a products para imagen referencial del ingrediente.
 * Ejecutar una vez: node src/config/migrate-product-image.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE products ADD COLUMN image_path VARCHAR(255) NULL AFTER description`);
      console.log('✔ products.image_path agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ products.image_path ya existe');
      } else throw e;
    }
    console.log('\n✅ migrate-product-image completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
