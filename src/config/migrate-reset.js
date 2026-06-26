/**
 * migrate-reset.js
 * Hace backup de datos, limpia la DB, recrea todo desde migraciones y restaura.
 *
 * USO: node src/config/migrate-reset.js
 *
 * ADVERTENCIA: elimina y recrea todas las tablas.
 * Los datos se preservan via backup JSON antes de limpiar.
 */
require('dotenv').config();
const { pool } = require('./database');
const { execSync } = require('child_process');
const path = require('path');
const fs   = require('fs');

// ── Orden de backup/restore (padres antes que hijos para el restore) ──────────
const TABLES = [
  'users',
  'business_settings',
  'categories',
  'units',
  'mold_types',
  'molds',
  'clients',
  'products',
  'calculation_presets',
  'calculation_preset_items',
  'proformas',
  'proforma_items',
  'orders',
  'order_items',
  'order_returns',
  'order_return_items',
];

// ── Migraciones en orden ───────────────────────────────────────────────────────
const MIGRATIONS = [
  'migrate.js',
  'migrate-v2.js',
  'migrate-cedula.js',
  'migrate-settings.js',
  'migrate-presets.js',
  'migrate-mold-types.js',
  'migrate-fragrance.js',
  'migrate-presets-v2.js',
  'migrate-presets-v3.js',
  'migrate-presets-v4.js',
  'migrate-username.js',
  'migrate-report-logo.js',
  'migrate-mold-type-image.js',
  'migrate-mold-image.js',
  'migrate-product-image.js',
  'migrate-delivery.js',
  'migrate-returns.js',
  'migrate-order-items-v2.js',
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function tableExists(conn, name) {
  return conn.query(
    `SELECT COUNT(*) AS cnt FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`, [name]
  ).then(([r]) => r[0].cnt > 0);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function run() {
  const dir        = __dirname;
  const backupFile = path.join(dir, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
  const conn       = await pool.getConnection();

  try {
    // ── 1. BACKUP ──────────────────────────────────────────────────────────
    console.log('\n📦  Haciendo backup de datos...\n');
    const backup = {};
    let totalRows = 0;

    for (const table of TABLES) {
      if (!(await tableExists(conn, table))) {
        backup[table] = [];
        console.log(`  ⚠  ${table}: no existe, se omite`);
        continue;
      }
      const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
      backup[table] = rows.map(r => {
        // Convertir Dates a ISO string para JSON
        const obj = {};
        for (const [k, v] of Object.entries(r)) {
          obj[k] = v instanceof Date ? v.toISOString() : v;
        }
        return obj;
      });
      totalRows += rows.length;
      console.log(`  ✔  ${table}: ${rows.length} registros`);
    }

    fs.writeFileSync(backupFile, JSON.stringify(backup, null, 2), 'utf8');
    console.log(`\n  💾  Backup guardado en: ${backupFile}`);
    console.log(`  📊  Total: ${totalRows} registros\n`);

    // ── 2. DROP ALL ────────────────────────────────────────────────────────
    console.log('🗑️   Eliminando tablas existentes...\n');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    for (const table of [...TABLES].reverse()) {
      await conn.query(`DROP TABLE IF EXISTS \`${table}\``);
      console.log(`  ✔  DROP ${table}`);
    }
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    conn.release();
    await pool.end();   // Cerrar pool antes de que cada migrate lo cierre por su cuenta

    // ── 3. MIGRACIONES ─────────────────────────────────────────────────────
    console.log('\n🔧  Ejecutando migraciones...\n');
    for (const file of MIGRATIONS) {
      console.log(`\n▶  ${file}`);
      console.log('─'.repeat(48));
      try {
        execSync(`node "${path.join(dir, file)}"`, { stdio: 'inherit' });
      } catch {
        console.error(`\n❌  Falló ${file}. Abortando.`);
        console.error(`    Los datos están en: ${backupFile}`);
        console.error(`    Podés restaurarlos con: node ${path.join(dir, 'migrate-restore.js')} ${backupFile}`);
        process.exit(1);
      }
    }

    // ── 4. RESTORE ─────────────────────────────────────────────────────────
    console.log('\n\n📥  Restaurando datos...\n');

    // Necesitamos un pool nuevo porque los scripts lo cerraron
    const { pool: pool2 } = require('./database');
    const conn2 = await pool2.getConnection();
    await conn2.query('SET FOREIGN_KEY_CHECKS = 0');

    let restoredTotal = 0;
    for (const table of TABLES) {
      const rows = backup[table] || [];
      if (rows.length === 0) continue;

      const cols     = Object.keys(rows[0]);
      const colsSql  = cols.map(c => `\`${c}\``).join(', ');
      const placeholders = cols.map(() => '?').join(', ');
      let inserted = 0;

      for (const row of rows) {
        const vals = cols.map(c => {
          const v = row[c];
          // Restaurar ISO strings de vuelta a formato que MySQL acepta
          if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
            return v.replace('T', ' ').slice(0, 19);
          }
          return v;
        });
        try {
          await conn2.query(
            `INSERT IGNORE INTO \`${table}\` (${colsSql}) VALUES (${placeholders})`,
            vals
          );
          inserted++;
        } catch (e) {
          console.log(`  ⚠  ${table} — fila omitida: ${e.message.slice(0, 80)}`);
        }
      }

      restoredTotal += inserted;
      console.log(`  ✔  ${table}: ${inserted}/${rows.length} registros restaurados`);
    }

    await conn2.query('SET FOREIGN_KEY_CHECKS = 1');
    conn2.release();
    await pool2.end();

    console.log(`\n✅  Reset completo.`);
    console.log(`    Registros restaurados: ${restoredTotal} / ${totalRows}`);
    console.log(`    Backup conservado en:  ${backupFile}\n`);

  } catch (err) {
    try { conn.release(); } catch {}
    console.error('\n❌  Error inesperado:', err.message);
    console.error(`    Si ya se hizo backup, podés restaurar con:`);
    console.error(`    node ${path.join(__dirname, 'migrate-restore.js')} ${backupFile}`);
    process.exit(1);
  }
}

run();
