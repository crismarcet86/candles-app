/**
 * migrate-presets-v3.js
 * Agrega labor_cost a calculation_presets.
 * Ejecutar una vez: node src/config/migrate-presets-v3.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`
        ALTER TABLE calculation_presets
          ADD COLUMN labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0
      `);
      console.log('✔ calculation_presets.labor_cost');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_presets.labor_cost ya existe');
      } else throw e;
    }

    console.log('\n✅ migrate-presets-v3 completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
