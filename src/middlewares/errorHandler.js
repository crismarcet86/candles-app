const logger = require('../utils/logger');

// eslint-disable-next-line no-unused-vars
module.exports = (err, _req, res, _next) => {
  logger.error(err.stack || err.message);
  res.status(err.statusCode || 500).json({
    ok: false,
    message: err.message || 'Error interno del servidor',
  });
};
