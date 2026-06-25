/**
 * migrate-delivery.js
 * Agrega delivery_date a proformas y delivery_status + delivery_date a orders.
 * Ejecutar una vez: node src/config/migrate-delivery.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    // proformas.delivery_date
    try {
      await conn.query(`ALTER TABLE proformas ADD COLUMN delivery_date DATE NULL AFTER notes`);
      console.log('✔ proformas.delivery_date agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ proformas.delivery_date ya existe');
      } else throw e;
    }

    // orders.delivery_date
    try {
      await conn.query(`ALTER TABLE orders ADD COLUMN delivery_date DATE NULL AFTER notes`);
      console.log('✔ orders.delivery_date agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ orders.delivery_date ya existe');
      } else throw e;
    }

    // orders.delivery_status
    try {
      await conn.query(`ALTER TABLE orders ADD COLUMN delivery_status ENUM('pendiente','entregado') NOT NULL DEFAULT 'pendiente' AFTER delivery_date`);
      console.log('✔ orders.delivery_status agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ orders.delivery_status ya existe');
      } else throw e;
    }

    console.log('\n✅ migrate-delivery completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
