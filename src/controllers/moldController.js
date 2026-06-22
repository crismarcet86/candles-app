const Mold = require('../models/Mold');
const { success, created, notFound } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try { success(res, await Mold.findAll()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const m = await Mold.findById(req.params.id);
    m ? success(res, m) : notFound(res, 'Molde no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const mold = await Mold.create(req.body);
    created(res, mold, 'Molde creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Mold.findById(req.params.id);
    if (!existing) return notFound(res, 'Molde no encontrado');
    const mold = await Mold.update(req.params.id, req.body);
    success(res, mold, 'Molde actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await Mold.deactivate(req.params.id);
    ok ? success(res, null, 'Molde desactivado') : notFound(res, 'Molde no encontrado');
  } catch (e) { next(e); }
};
