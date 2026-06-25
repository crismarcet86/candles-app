/**
 * Migración: tipos de molde + campos total_grams y mold_type_id en molds
 * Ejecutar: node src/config/migrate-mold-types.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS mold_types (
        id         INT AUTO_INCREMENT PRIMARY KEY,
        name       VARCHAR(100) NOT NULL,
        is_active  TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Tabla mold_types OK');

    // total_grams
    const [[tgRow]] = await conn.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'molds' AND COLUMN_NAME = 'total_grams'
    `);
    if (!tgRow.cnt) {
      await conn.query('ALTER TABLE molds ADD COLUMN total_grams DECIMAL(8,2) NULL AFTER wax_grams');
      console.log('✓ Columna total_grams agregada a molds');
    } else {
      console.log('  total_grams ya existe');
    }

    // mold_type_id
    const [[mtRow]] = await conn.query(`
      SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'molds' AND COLUMN_NAME = 'mold_type_id'
    `);
    if (!mtRow.cnt) {
      await conn.query('ALTER TABLE molds ADD COLUMN mold_type_id INT NULL AFTER id');
      console.log('✓ Columna mold_type_id agregada a molds');
    } else {
      console.log('  mold_type_id ya existe');
    }

    // FK separada para que sea re-ejecutable independientemente
    try {
      await conn.query(`
        ALTER TABLE molds
        ADD CONSTRAINT fk_molds_mold_type
        FOREIGN KEY (mold_type_id) REFERENCES mold_types(id) ON DELETE SET NULL
      `);
      console.log('✓ FK fk_molds_mold_type agregada');
    } catch (e) {
      if (e.code === 'ER_FK_DUP_NAME' || e.code === 'ER_DUP_KEYNAME' ||
          e.message.includes('Duplicate key name') || e.message.includes('fk_molds_mold_type')) {
        console.log('  FK fk_molds_mold_type ya existe');
      } else throw e;
    }

    console.log('\n✅ Migración completada');
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    conn.release();
    process.exit(0);
  }
}

run();
