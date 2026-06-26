const path = require('path');
const Mold = require('../models/Mold');
const Settings = require('../models/Settings');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

const buildImageUrl = (req, image_path) =>
  image_path ? `${req.protocol}://${req.get('host')}/uploads/${image_path}` : null;

const fmt = (req, m) => m ? { ...m, image_url: buildImageUrl(req, m.image_path) } : null;
const fmtAll = (req, rows) => rows.map(m => fmt(req, m));

exports.getAll = async (req, res, next) => {
  try {
    const { name = '', mold_type_id = null } = req.query;
    success(res, fmtAll(req, await Mold.findAll({ name, mold_type_id: mold_type_id || null })));
  } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const m = await Mold.findById(req.params.id);
    m ? success(res, fmt(req, m)) : notFound(res, 'Molde no encontrado');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const mold = await Mold.create(req.body);
    created(res, fmt(req, mold), 'Molde creado');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Mold.findById(req.params.id);
    if (!existing) return notFound(res, 'Molde no encontrado');
    const mold = await Mold.update(req.params.id, req.body);
    success(res, fmt(req, mold), 'Molde actualizado');
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    const ok = await Mold.deactivate(req.params.id);
    ok ? success(res, null, 'Molde desactivado') : notFound(res, 'Molde no encontrado');
  } catch (e) { next(e); }
};

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ ok: false, message: 'No se recibió archivo' });
    const m = await Mold.findById(req.params.id);
    if (!m) return notFound(res, 'Molde no encontrado');
    const updated = await Mold.updateImage(req.params.id, req.file.filename);
    success(res, fmt(req, updated), 'Imagen actualizada');
  } catch (e) { next(e); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const { name = '', mold_type_id = null } = req.query;
    const [molds, settings] = await Promise.all([Mold.findAll({ name, mold_type_id: mold_type_id || null }), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = molds.map(m => [
      m.name,
      m.mold_type_name || '—',
      m.total_grams != null ? m.total_grams : '—',
      m.wax_grams,
      m.description || '—',
      m.is_active === 1 ? 'Activo' : 'Inactivo',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Moldes',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'TIPO', 'PESO TOTAL (g)', 'CERA (g)', 'DESCRIPCIÓN', 'ESTADO'],
      widths:  [130, 80, 75, 65, 100, 55],
      aligns:  ['left', 'left', 'right', 'right', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="moldes.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
