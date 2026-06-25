/**
 * migrate-all.js — Ejecuta TODAS las migraciones en orden.
 * Seguro de re-ejecutar: cada migración es idempotente.
 *
 * Uso: node src/config/migrate-all.js
 */
require('dotenv').config();
const { pool } = require('./database');
const { execSync } = require('child_process');
const path = require('path');

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

async function runAll() {
  console.log('\n🕯️  Ejecutando todas las migraciones...\n');
  const dir = __dirname;

  for (const file of MIGRATIONS) {
    const filePath = path.join(dir, file);
    console.log(`\n▶  ${file}`);
    console.log('─'.repeat(50));
    try {
      execSync(`node "${filePath}"`, { stdio: 'inherit' });
    } catch (err) {
      console.error(`\n❌ Falló ${file}. Abortando.`);
      process.exit(1);
    }
  }

  console.log('\n\n✅ Todas las migraciones completadas.\n');
  process.exit(0);
}

runAll();
