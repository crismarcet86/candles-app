require('dotenv').config();
const { pool } = require('./database');

async function run() {
  // Agrega columna is_fragrance a categories si no existe
  const [cols] = await pool.query(`
    SELECT COLUMN_NAME
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'categories'
      AND COLUMN_NAME  = 'is_fragrance'
  `);

  if (cols.length === 0) {
    await pool.query(`
      ALTER TABLE categories
      ADD COLUMN is_fragrance TINYINT(1) NOT NULL DEFAULT 0
      AFTER description
    `);
    console.log('✅ Columna is_fragrance agregada a categories');
  } else {
    console.log('ℹ️  Columna is_fragrance ya existe en categories');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error en migración:', err.message);
  process.exit(1);
});
