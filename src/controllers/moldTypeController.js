const MoldType = require('../models/MoldType');
const { success, created, notFound, badRequest } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try { success(res, await MoldType.findAll()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const t = await MoldType.findById(req.params.id);
    t ? success(res, t) : notFound(res, 'Tipo de molde no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    created(res, await MoldType.create({ name: name.trim() }), 'Tipo de molde creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await MoldType.findById(req.params.id);
    if (!existing) return notFound(res, 'Tipo de molde no encontrado');
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    success(res, await MoldType.update(req.params.id, req.body), 'Tipo de molde actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await MoldType.deactivate(req.params.id);
    ok ? success(res, null, 'Tipo de molde desactivado') : notFound(res, 'Tipo de molde no encontrado');
  } catch (e) { next(e); }
};
