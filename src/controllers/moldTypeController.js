const MoldType = require('../models/MoldType');
const { success, created, notFound, badRequest } = require('../utils/response');

const buildImageUrl = (req, image_path) => {
  if (!image_path) return null;
  return `${req.protocol}://${req.get('host')}/uploads/${image_path}`;
};

const fmt = (req, t) => t ? { ...t, image_url: buildImageUrl(req, t.image_path) } : null;
const fmtAll = (req, rows) => rows.map(t => fmt(req, t));

exports.getAll = async (req, res, next) => {
  try {
    const { name = '' } = req.query;
    success(res, fmtAll(req, await MoldType.findAll({ name })));
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const t = await MoldType.findById(req.params.id);
    t ? success(res, fmt(req, t)) : notFound(res, 'Tipo de molde no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    created(res, fmt(req, await MoldType.create({ name: name.trim() })), 'Tipo de molde creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await MoldType.findById(req.params.id);
    if (!existing) return notFound(res, 'Tipo de molde no encontrado');
    const { name } = req.body;
    if (!name?.trim()) return badRequest(res, 'El nombre es requerido');
    success(res, fmt(req, await MoldType.update(req.params.id, req.body)), 'Tipo de molde actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await MoldType.deactivate(req.params.id);
    ok ? success(res, null, 'Tipo de molde desactivado') : notFound(res, 'Tipo de molde no encontrado');
  } catch (e) { next(e); }
};

exports.uploadImage = async (req, res, next) => {
  try {
    const t = await MoldType.findById(req.params.id);
    if (!t) return notFound(res, 'Tipo de molde no encontrado');
    if (!req.file) return badRequest(res, 'No se recibió ningún archivo');
    const updated = await MoldType.updateImage(req.params.id, req.file.filename);
    success(res, fmt(req, updated), 'Imagen actualizada');
  } catch (e) { next(e); }
};
