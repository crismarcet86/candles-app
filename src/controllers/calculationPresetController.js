const CalculationPreset = require('../models/CalculationPreset');
const { success, created, notFound, badRequest } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try {
    const includeInactive = req.query.all === '1';
    success(res, await CalculationPreset.findAll({ includeInactive }));
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await CalculationPreset.findById(req.params.id);
    p ? success(res, p) : notFound(res, 'Cálculo no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name, items } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'Se requieren productos');
    const dup = await CalculationPreset.findByName(name.trim());
    if (dup) return badRequest(res, `Ya existe un cálculo guardado con el nombre "${name.trim()}"`);
    created(res, await CalculationPreset.create(req.body), 'Cálculo guardado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const { name, items } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    if (!Array.isArray(items) || items.length === 0) return badRequest(res, 'Se requieren productos');
    const dup = await CalculationPreset.findByName(name.trim(), +req.params.id);
    if (dup) return badRequest(res, `Ya existe un cálculo guardado con el nombre "${name.trim()}"`);
    const updated = await CalculationPreset.update(req.params.id, req.body);
    updated ? success(res, updated, 'Cálculo actualizado') : notFound(res, 'Cálculo no encontrado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await CalculationPreset.delete(req.params.id);
    ok ? success(res, null, 'Cálculo eliminado') : notFound(res, 'Cálculo no encontrado');
  } catch (e) { next(e); }
};
