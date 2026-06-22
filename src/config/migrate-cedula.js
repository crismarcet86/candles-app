/**
 * Migración v3 — Agrega campo cedula a clients
 * Ejecutar: node src/config/migrate-cedula.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🪪  Agregando campo cedula a clients...\n');

    try {
      await conn.query(`ALTER TABLE clients ADD COLUMN cedula VARCHAR(20) DEFAULT NULL AFTER name`);
      console.log('  ✅ Columna cedula agregada a clients');
    } catch (err) {
      if (err.code === 'ER_DUP_FIELDNAME' || (err.message && err.message.includes('Duplicate column'))) {
        console.log('  ⏭️  Columna cedula ya existe');
      } else {
        throw err;
      }
    }

    console.log('\n✅ Migración completada.\n');
  } finally {
    conn.release();
    pool.end();
  }
}

migrate().catch(err => {
  console.error('❌ Error en migración:', err.message);
  process.exit(1);
});
