const Unit = require('../models/Unit');
const Settings = require('../models/Settings');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll  = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    success(res, await Unit.findAll({ search }));
  } catch (e) { next(e); }
};
exports.getById = async (req, res, next) => { try { const u = await Unit.findById(req.params.id); u ? success(res, u) : notFound(res, 'Unidad no encontrada'); } catch (e) { next(e); } };
exports.create  = async (req, res, next) => { try { created(res, await Unit.create(req.body)); } catch (e) { next(e); } };
exports.update  = async (req, res, next) => { try { const u = await Unit.findById(req.params.id); if (!u) return notFound(res, 'Unidad no encontrada'); success(res, await Unit.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove  = async (req, res, next) => { try { const ok = await Unit.delete(req.params.id); ok ? success(res, null, 'Unidad eliminada') : notFound(res, 'Unidad no encontrada'); } catch (e) { next(e); } };

exports.getPdf = async (req, res, next) => {
  try {
    const { search = '' } = req.query;
    const [units, settings] = await Promise.all([Unit.findAll({ search }), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = units.map(u => [
      u.name,
      u.abbreviation,
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Unidades de Medida',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'ABREVIATURA'],
      widths:  [250, 245],
      aligns:  ['left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="unidades.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
