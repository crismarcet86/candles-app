/**
 * migrate-report-logo.js
 * Agrega columna report_logo_path a business_settings para imagen de PDFs/reportes.
 * Ejecutar una vez: node src/config/migrate-report-logo.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE business_settings ADD COLUMN report_logo_path VARCHAR(255) NULL AFTER logo_path`);
      console.log('✔ business_settings.report_logo_path agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ business_settings.report_logo_path ya existe');
      } else throw e;
    }
    console.log('\n✅ migrate-report-logo completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
