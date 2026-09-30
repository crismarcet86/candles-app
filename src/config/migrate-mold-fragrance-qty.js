/**
 * migrate-mold-fragrance-qty.js
 * Agrega mold_types.fragrance_pct (% de fragancia por defecto) y molds.quantity (unidades disponibles).
 * Ejecutar una vez: node src/config/migrate-mold-fragrance-qty.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function addColumn(conn, sql, label) {
  try {
    await conn.query(sql);
    console.log(`✔ ${label} agregada`);
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
      console.log(`ℹ ${label} ya existe`);
    } else throw e;
  }
}

async function run() {
  const conn = await pool.getConnection();
  try {
    await addColumn(conn, `ALTER TABLE mold_types ADD COLUMN fragrance_pct DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER name`, 'mold_types.fragrance_pct');
    await addColumn(conn, `ALTER TABLE molds ADD COLUMN quantity INT NOT NULL DEFAULT 0 AFTER wax_grams`, 'molds.quantity');
    console.log('\n✅ migrate-mold-fragrance-qty completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
