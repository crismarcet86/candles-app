/**
 * migrate-presets-v4.js
 * Agrega labor_hours a calculation_presets.
 * Ejecutar una vez: node src/config/migrate-presets-v4.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`
        ALTER TABLE calculation_presets
          ADD COLUMN labor_hours DECIMAL(6,2) NOT NULL DEFAULT 1
      `);
      console.log('✔ calculation_presets.labor_hours');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_presets.labor_hours ya existe');
      } else throw e;
    }

    console.log('\n✅ migrate-presets-v4 completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
