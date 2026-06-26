/**
 * migrate-presets.js
 * Crea tablas para guardar cálculos de calculadora y los vincula a proformas.
 * Ejecutar una vez: node src/config/migrate-presets.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    // 1. Presets (cálculos guardados)
    await conn.query(`
      CREATE TABLE IF NOT EXISTS calculation_presets (
        id            INT AUTO_INCREMENT PRIMARY KEY,
        name          VARCHAR(150) NOT NULL,
        mold_name     VARCHAR(100) NULL,
        wax_grams     DECIMAL(10,2) NULL,
        quantity      INT NOT NULL DEFAULT 1,
        sell_price    DECIMAL(10,2) NOT NULL DEFAULT 0,
        cost_per_unit DECIMAL(12,4) NOT NULL DEFAULT 0,
        is_active     TINYINT(1) NOT NULL DEFAULT 1,
        created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at    TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✔ calculation_presets');

    // updated_at — para instalaciones existentes que no lo tienen
    try {
      await conn.query(`
        ALTER TABLE calculation_presets
          ADD COLUMN updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      `);
      console.log('✔ calculation_presets.updated_at agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ calculation_presets.updated_at ya existe');
      } else throw e;
    }

    // 2. Ingredientes de cada preset
    await conn.query(`
      CREATE TABLE IF NOT EXISTS calculation_preset_items (
        id              INT AUTO_INCREMENT PRIMARY KEY,
        preset_id       INT NOT NULL,
        product_id      INT NULL,
        ingredient_name VARCHAR(150) NOT NULL,
        grams           DECIMAL(12,4) NOT NULL,
        is_unit         TINYINT(1) NOT NULL DEFAULT 0,
        unit_abbr       VARCHAR(20) NOT NULL DEFAULT '',
        unit_cost       DECIMAL(14,6) NOT NULL DEFAULT 0,
        subtotal        DECIMAL(12,4) NOT NULL DEFAULT 0,
        FOREIGN KEY (preset_id)   REFERENCES calculation_presets(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id)  REFERENCES products(id)            ON DELETE SET NULL
      )
    `);
    console.log('✔ calculation_preset_items');

    // 3. Columna preset_id en proforma_items (ignora si ya existe)
    try {
      await conn.query(`
        ALTER TABLE proforma_items
          ADD COLUMN preset_id INT NULL AFTER product_id,
          ADD CONSTRAINT fk_pi_preset
            FOREIGN KEY (preset_id) REFERENCES calculation_presets(id) ON DELETE SET NULL
      `);
      console.log('✔ proforma_items.preset_id');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ proforma_items.preset_id ya existe');
      } else {
        throw e;
      }
    }

    console.log('\n✅ migrate-presets completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
