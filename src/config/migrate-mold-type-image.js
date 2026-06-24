/**
 * migrate-mold-type-image.js
 * Agrega columna image_path a mold_types para imagen referencial del tipo de molde.
 * Ejecutar una vez: node src/config/migrate-mold-type-image.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE mold_types ADD COLUMN image_path VARCHAR(255) NULL AFTER name`);
      console.log('✔ mold_types.image_path agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ mold_types.image_path ya existe');
      } else throw e;
    }
    console.log('\n✅ migrate-mold-type-image completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
