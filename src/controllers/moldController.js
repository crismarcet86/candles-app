const Mold = require('../models/Mold');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

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

exports.getPdf = async (req, res, next) => {
  try {
    const molds = await Mold.findAll();
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = molds.map(m => [
      m.name,
      m.wax_grams,
      m.description || '—',
      m.is_active === 1 ? 'Activo' : 'Inactivo',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Moldes',
      subtitle,
      headers: ['NOMBRE', 'CERA (g)', 'DESCRIPCIÓN', 'ESTADO'],
      widths:  [200, 90, 145, 60],
      aligns:  ['left', 'right', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="moldes.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
