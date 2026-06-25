/**
 * migrate-order-items-v2.js
 * Agrega preset_id e is_service a order_items.
 * Ejecutar una vez: node src/config/migrate-order-items-v2.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    try {
      await conn.query(`ALTER TABLE order_items ADD COLUMN preset_id INT NULL AFTER product_id`);
      console.log('✔ order_items.preset_id agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ order_items.preset_id ya existe');
      } else throw e;
    }

    try {
      await conn.query(`ALTER TABLE order_items ADD COLUMN is_service TINYINT(1) NOT NULL DEFAULT 0 AFTER preset_id`);
      console.log('✔ order_items.is_service agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ order_items.is_service ya existe');
      } else throw e;
    }

    console.log('\n✅ migrate-order-items-v2 completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
