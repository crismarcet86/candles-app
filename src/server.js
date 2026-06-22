require('dotenv').config();
const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 3000;

async function start() {
  await testConnection();
  app.listen(PORT, () => {
    logger.info(`🕯️  Servidor corriendo en http://localhost:${PORT}`);
    logger.info(`   Entorno: ${process.env.NODE_ENV || 'development'}`);
  });
}

start().catch((err) => {
  logger.error('Error al iniciar el servidor:', err);
  process.exit(1);
});
