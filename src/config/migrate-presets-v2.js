/**
 * migrate-presets-v2.js
 * Agrega includes_color a calculation_presets y fragrance_pct a calculation_preset_items.
 * Ejecutar una vez: node src/config/migrate-presets-v2.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    // 1. includes_color en calculation_presets
    try {
      await conn.query(`
        ALTER TABLE calculation_presets
          ADD COLUMN includes_color TINYINT(1) NOT NULL DEFAULT 0
      `);
      console.log('✔ calculation_presets.includes_color');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_presets.includes_color ya existe');
      } else throw e;
    }

    // 2. fragrance_pct en calculation_preset_items
    try {
      await conn.query(`
        ALTER TABLE calculation_preset_items
          ADD COLUMN fragrance_pct DECIMAL(6,2) NULL DEFAULT NULL
      `);
      console.log('✔ calculation_preset_items.fragrance_pct');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_preset_items.fragrance_pct ya existe');
      } else throw e;
    }

    console.log('\n✅ migrate-presets-v2 completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
