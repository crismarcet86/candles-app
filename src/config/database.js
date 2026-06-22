const mysql = require('mysql2/promise');
const logger = require('../utils/logger');

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     Number(process.env.DB_PORT) || 3306,
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'candles_app',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function testConnection() {
  try {
    const conn = await pool.getConnection();
    logger.info('✅ Conexión a MySQL exitosa');
    conn.release();
  } catch (err) {
    logger.error('❌ Error al conectar con MySQL:', err.message);
    throw err;
  }
}

module.exports = { pool, testConnection };
