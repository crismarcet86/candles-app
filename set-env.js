#!/usr/bin/env node
/**
 * Genera frontend/src/environments/environment.ts a partir del .env raíz.
 * Ejecutar antes de `ng serve` o `ng build`.
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

const serverIp   = process.env.SERVER_IP || 'localhost';
const port       = process.env.PORT      || '3000';
const apiUrl     = `http://${serverIp}:${port}/api`;

const content = `// Generado automáticamente por set-env.js — no editar a mano
export const environment = {
  production: false,
  apiUrl: '${apiUrl}'
};
`;

const fs   = require('fs');
const dest = path.resolve(__dirname, 'frontend/src/environments/environment.ts');
fs.writeFileSync(dest, content, 'utf8');
console.log(`[set-env] apiUrl → ${apiUrl}`);
