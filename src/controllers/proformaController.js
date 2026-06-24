const Proforma = require('../models/Proforma');
const Settings = require('../models/Settings');
const { generateProformaPDF } = require('../utils/pdfProforma');
const { generateListPDF } = require('../utils/pdfList');
const { success, created, notFound, error } = require('../utils/response');

exports.getAll = async (req, res, next) => {
  try { success(res, await Proforma.findAll()); } catch (e) { next(e); }
};

exports.getById = async (req, res, next) => {
  try {
    const p = await Proforma.findById(req.params.id);
    p ? success(res, p) : notFound(res, 'Proforma no encontrada');
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const proforma = await Proforma.save(req.body);
    created(res, proforma, 'Proforma creada');
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const existing = await Proforma.findById(req.params.id);
    if (!existing) return notFound(res, 'Proforma no encontrada');
    if (existing.status !== 'borrador') return error(res, 'Solo se pueden editar proformas en borrador', 422);
    const proforma = await Proforma.save({ id: req.params.id, ...req.body });
    success(res, proforma, 'Proforma actualizada');
  } catch (e) { next(e); }
};

exports.confirm = async (req, res, next) => {
  try {
    const result = await Proforma.confirm(req.params.id);
    success(res, result, 'Proforma confirmada y orden generada');
  } catch (e) {
    if (e.message.includes('Stock insuficiente') || e.message.includes('borrador')) {
      return error(res, e.message, 422);
    }
    next(e);
  }
};

exports.cancel = async (req, res, next) => {
  try {
    const ok = await Proforma.cancel(req.params.id);
    ok ? success(res, null, 'Proforma cancelada') : notFound(res, 'Proforma no encontrada o ya no está en borrador');
  } catch (e) { next(e); }
};

// GET /api/proformas/pdf — listado PDF de todas las proformas
exports.getListPdf = async (req, res, next) => {
  try {
    const [proformas, settings] = await Promise.all([Proforma.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = proformas.map(p => [
      String(p.id).padStart(4, '0'),
      p.client_name || '—',
      `S/ ${(+p.total).toFixed(2)}`,
      p.status,
      p.notes || '—',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Proformas',
      subtitle, businessName, logoPath,
      headers: ['ID', 'CLIENTE', 'TOTAL', 'ESTADO', 'NOTAS'],
      widths:  [40, 175, 80, 80, 120],
      aligns:  ['left', 'left', 'right', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="proformas.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};

// GET /api/proformas/:id/pdf — descarga el PDF de la proforma
exports.getPdf = async (req, res, next) => {
  try {
    const proforma = await Proforma.findById(req.params.id);
    if (!proforma) return notFound(res, 'Proforma no encontrada');

    const settings = await Settings.get();
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const pdfBuffer = await generateProformaPDF(proforma, businessName, logoPath);

    const filename = `proforma-${String(proforma.id).padStart(4, '0')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (e) { next(e); }
};
