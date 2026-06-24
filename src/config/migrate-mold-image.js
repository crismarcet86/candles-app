/**
 * migrate-mold-image.js
 * Agrega columna image_path a molds para imagen referencial del molde.
 * Ejecutar una vez: node src/config/migrate-mold-image.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE molds ADD COLUMN image_path VARCHAR(255) NULL AFTER description`);
      console.log('✔ molds.image_path agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ molds.image_path ya existe');
      } else throw e;
    }
    console.log('\n✅ migrate-mold-image completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
