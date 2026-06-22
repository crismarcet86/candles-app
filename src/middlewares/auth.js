const jwt = require('jsonwebtoken');
const { error } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'cambia_esto_en_produccion';

/**
 * requireAuth — verifica que el token JWT sea válido.
 * Agrega req.user con el payload decodificado.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token requerido', 401);
  }
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return error(res, 'Token inválido o expirado', 401);
  }
}

/**
 * requireAdmin — solo permite acceso a usuarios con role = 'admin'.
 * Debe ir después de requireAuth.
 */
function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return error(res, 'Acceso denegado: se requiere rol admin', 403);
  }
  next();
}

module.exports = { requireAuth, requireAdmin };
