const User = require('../models/User');
const { success, created, notFound, badRequest } = require('../utils/response');

// Solo accesible por admin (el middleware requireAdmin lo verifica)

exports.getAll = async (req, res, next) => {
  try { success(res, await User.findAll()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    u ? success(res, u) : notFound(res, 'Usuario no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const existing = await User.findByEmail(req.body.email);
    if (existing) return badRequest(res, 'El correo ya está registrado');
    const user = await User.create(req.body);
    created(res, user, 'Usuario creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const u = await User.findById(req.params.id);
    if (!u) return notFound(res, 'Usuario no encontrado');
    success(res, await User.update(req.params.id, req.body), 'Usuario actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await User.delete(req.params.id);
    ok ? success(res, null, 'Usuario desactivado') : notFound(res, 'Usuario no encontrado');
  } catch (e) { next(e); }
};
