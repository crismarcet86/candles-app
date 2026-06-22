require('dotenv').config();
const { pool } = require('./database');

async function run() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS business_settings (
      id           INT          NOT NULL DEFAULT 1,
      name         VARCHAR(100) NOT NULL DEFAULT 'Mi Negocio',
      ruc          VARCHAR(20)  NULL,
      phone        VARCHAR(30)  NULL,
      observations TEXT         NULL,
      logo_path    VARCHAR(255) NULL,
      updated_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  // Insert default row if not exists
  await pool.query(`
    INSERT IGNORE INTO business_settings (id, name) VALUES (1, 'Mi Negocio')
  `);

  console.log('✅ business_settings creada e inicializada');
  process.exit(0);
}

run().catch(e => { console.error(e.message); process.exit(1); });
