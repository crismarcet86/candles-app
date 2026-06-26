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

    // orders.status — ampliar ENUM para incluir valores de devolución
    // El ENUM original era ('pendiente','entregado','cancelado').
    // Las devoluciones usan 'anulado parcial' y 'anulado total'.
    // MODIFY es idempotente: si los valores ya están, no cambia nada funcional.
    try {
      await conn.query(`
        ALTER TABLE orders
          MODIFY COLUMN status
            ENUM('pendiente','entregado','cancelado','anulado parcial','anulado total')
            NOT NULL DEFAULT 'pendiente'
      `);
      console.log('✔ orders.status ENUM actualizado con valores de devolución');
    } catch (e) {
      console.log('ℹ orders.status ENUM:', e.message);
    }

    console.log('\n✅ migrate-delivery completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
