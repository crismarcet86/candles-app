/**
 * Migración v2 — Adaptación al modelo de negocio de velas artesanales
 * Ejecutar: node src/config/migrate-v2.js
 */
require('dotenv').config();
const { pool } = require('./database');

async function run(conn, sql, desc) {
  try {
    await conn.query(sql);
    console.log(`  ✅ ${desc}`);
  } catch (err) {
    if (err.code === 'ER_DUP_FIELDNAME' || err.code === 'ER_TABLE_EXISTS_ERROR' || err.message.includes('Duplicate column')) {
      console.log(`  ⏭️  ${desc} (ya existe)`);
    } else {
      throw err;
    }
  }
}

async function migrate() {
  const conn = await pool.getConnection();
  try {
    console.log('\n🕯️  Migrando base de datos a modelo de velas artesanales...\n');

    // 1. Tabla de moldes
    await run(conn, `
      CREATE TABLE IF NOT EXISTS molds (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        name        VARCHAR(150)  NOT NULL,
        wax_grams   DECIMAL(10,3) NOT NULL,
        description TEXT,
        is_active   TINYINT(1)    NOT NULL DEFAULT 1,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `, 'Tabla molds');

    // 2. Agregar labor_cost a proformas
    await run(conn,
      'ALTER TABLE proformas ADD COLUMN labor_cost DECIMAL(10,2) NOT NULL DEFAULT 0 AFTER discount',
      'Campo labor_cost en proformas'
    );

    // 3. Hacer product_id nullable en proforma_items (items pueden ser texto libre)
    await run(conn,
      'ALTER TABLE proforma_items MODIFY COLUMN product_id INT NULL',
      'product_id nullable en proforma_items'
    );

    // 4. Agregar description a proforma_items
    await run(conn,
      'ALTER TABLE proforma_items ADD COLUMN description VARCHAR(255) NULL AFTER product_id',
      'Campo description en proforma_items'
    );

    // 5. Hacer product_id nullable en order_items
    await run(conn,
      'ALTER TABLE order_items MODIFY COLUMN product_id INT NULL',
      'product_id nullable en order_items'
    );

    // 6. Agregar description a order_items
    await run(conn,
      'ALTER TABLE order_items ADD COLUMN description VARCHAR(255) NULL AFTER product_id',
      'Campo description en order_items'
    );

    // 7. Actualizar categorías para velas artesanales
    await run(conn, `
      INSERT IGNORE INTO categories (name, description) VALUES
        ('Ceras',             'Cera de abeja, parafina, cera de soya, etc.'),
        ('Esencias',          'Aceites esenciales y fragancias para velas'),
        ('Pabilos',           'Mechas y pabilos de distintos calibres'),
        ('Colorantes',        'Colorantes para velas'),
        ('Otros materiales',  'Recipientes, etiquetas y otros insumos')
    `, 'Categorías de ingredientes');

    console.log('\n✅ Migración v2 completada\n');
  } catch (err) {
    console.error('\n❌ Error en migración:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    process.exit(0);
  }
}

migrate();
