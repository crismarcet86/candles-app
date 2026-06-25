/**
 * migrate-restore.js
 * Restaura datos desde un archivo JSON generado por migrate-reset.js.
 *
 * USO: node src/config/migrate-restore.js <ruta-al-backup.json>
 *
 * Útil si migrate-reset.js falló durante el restore y necesitás reintentar.
 */
require('dotenv').config();
const { pool } = require('./database');
const path = require('path');
const fs   = require('fs');

const TABLES = [
  'users', 'business_settings', 'categories', 'units',
  'mold_types', 'molds', 'clients', 'products',
  'calculation_presets', 'calculation_preset_items',
  'proformas', 'proforma_items',
  'orders', 'order_items',
  'order_returns', 'order_return_items',
];

async function run() {
  const backupFile = process.argv[2];
  if (!backupFile) {
    console.error('❌  Uso: node src/config/migrate-restore.js <ruta-al-backup.json>');
    process.exit(1);
  }
  if (!fs.existsSync(backupFile)) {
    console.error(`❌  Archivo no encontrado: ${backupFile}`);
    process.exit(1);
  }

  const backup = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
  const conn   = await pool.getConnection();

  console.log(`\n📥  Restaurando desde: ${backupFile}\n`);
  await conn.query('SET FOREIGN_KEY_CHECKS = 0');

  let total = 0, restored = 0;
  for (const table of TABLES) {
    const rows = backup[table] || [];
    if (rows.length === 0) continue;
    total += rows.length;

    const cols        = Object.keys(rows[0]);
    const colsSql     = cols.map(c => `\`${c}\``).join(', ');
    const placeholders = cols.map(() => '?').join(', ');
    let inserted = 0;

    for (const row of rows) {
      const vals = cols.map(c => {
        const v = row[c];
        if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
          return v.replace('T', ' ').slice(0, 19);
        }
        return v;
      });
      try {
        await conn.query(
          `INSERT IGNORE INTO \`${table}\` (${colsSql}) VALUES (${placeholders})`,
          vals
        );
        inserted++;
      } catch (e) {
        console.log(`  ⚠  ${table} — fila omitida: ${e.message.slice(0, 80)}`);
      }
    }

    restored += inserted;
    console.log(`  ✔  ${table}: ${inserted}/${rows.length}`);
  }

  await conn.query('SET FOREIGN_KEY_CHECKS = 1');
  conn.release();
  await pool.end();

  console.log(`\n✅  Restore completo: ${restored}/${total} registros.\n`);
}

run().catch(err => { console.error('❌', err.message); process.exit(1); });
