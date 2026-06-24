/**
 * migrate-username.js
 * Agrega columna username a users y la puebla desde el email existente.
 * Ejecutar una vez: node src/config/migrate-username.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run() {
  const conn = await pool.getConnection();
  try {
    // 1. Agregar columna nullable
    try {
      await conn.query(`ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER name`);
      console.log('✔ users.username agregada');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME' || e.message.includes('Duplicate column')) {
        console.log('ℹ users.username ya existe');
      } else throw e;
    }

    // 2. Poblar con prefijo del email (garantiza unicidad por id si hay colisión)
    await conn.query(`
      UPDATE users
      SET username = IF(
        email IS NOT NULL AND email != '',
        LOWER(SUBSTRING_INDEX(email, '@', 1)),
        CONCAT('user', id)
      )
      WHERE username IS NULL OR username = ''
    `);
    console.log('✔ usernames poblados desde email');

    // 3. Agregar UNIQUE index
    try {
      await conn.query(`ALTER TABLE users ADD UNIQUE INDEX idx_username (username)`);
      console.log('✔ UNIQUE index en username');
    } catch (e) {
      if (e.message.includes('Duplicate key name') || e.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ UNIQUE index ya existe');
      } else throw e;
    }

    // 4. Hacer NOT NULL
    try {
      await conn.query(`ALTER TABLE users MODIFY username VARCHAR(100) NOT NULL`);
      console.log('✔ username NOT NULL');
    } catch (e) {
      console.log('ℹ username ya es NOT NULL o error menor:', e.message);
    }

    console.log('\n✅ migrate-username completado');
  } finally {
    conn.release();
    await pool.end();
  }
}

run().catch(err => { console.error(err); process.exit(1); });
