/**
 * migrate-presets-v5.js
 * Agrega color_cost a calculation_presets y la tabla calculation_preset_extras
 * (elementos extra por vela: papel kraft, cinta, etiqueta...).
 * Ejecutar una vez: node src/config/migrate-presets-v5.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE calculation_presets ADD COLUMN color_cost DECIMAL(10,4) NOT NULL DEFAULT 0.10`);
      console.log('✔ calculation_presets.color_cost agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_presets.color_cost ya existe');
      } else throw e;
    }

    await conn.query(`
      CREATE TABLE IF NOT EXISTS calculation_preset_extras (
        id        INT AUTO_INCREMENT PRIMARY KEY,
        preset_id INT NOT NULL,
        name      VARCHAR(150) NOT NULL,
        cost      DECIMAL(12,4) NOT NULL DEFAULT 0,
        FOREIGN KEY (preset_id) REFERENCES calculation_presets(id) ON DELETE CASCADE
      )
    `);
    console.log('✔ calculation_preset_extras');

    console.log('\n✅ migrate-presets-v5 completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
