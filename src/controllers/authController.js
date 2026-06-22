const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { success, created, error, badRequest } = require('../utils/response');

const JWT_SECRET  = process.env.JWT_SECRET  || 'cambia_esto_en_produccion';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  );
}

// POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    const existing = await User.findByEmail(email);
    if (existing) return badRequest(res, 'El correo ya está registrado');
    const user = await User.create({ name, email, password, role });
    const token = signToken(user);
    created(res, { user, token }, 'Usuario creado exitosamente');
  } catch (err) { next(err); }
};

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByEmail(email);
    if (!user) return error(res, 'Credenciales inválidas', 401);
    const valid = await User.verifyPassword(password, user.password);
    if (!valid) return error(res, 'Credenciales inválidas', 401);
    const token = signToken(user);
    // No devolver el hash
    const { password: _pw, ...safeUser } = user;
    success(res, { user: safeUser, token }, 'Sesión iniciada');
  } catch (err) { next(err); }
};

// GET /api/auth/me  (requiere token)
exports.me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return error(res, 'Usuario no encontrado', 404);
    success(res, user);
  } catch (err) { next(err); }
};

// POST /api/auth/change-password  (requiere token)
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findByEmail(req.user.email);
    const valid = await User.verifyPassword(current_password, user.password);
    if (!valid) return badRequest(res, 'Contraseña actual incorrecta');
    await User.changePassword(req.user.id, new_password);
    success(res, null, 'Contraseña actualizada');
  } catch (err) { next(err); }
};
