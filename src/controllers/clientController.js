const Client = require('../models/Client');
const Settings = require('../models/Settings');
const { success, created, notFound, badRequest } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll    = async (req, res, next) => { try { success(res, await Client.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const c = await Client.findById(req.params.id); c ? success(res, c) : notFound(res, 'Cliente no encontrado'); } catch (e) { next(e); } };
exports.create = async (req, res, next) => {
  try {
    if (req.body.cedula?.trim()) {
      const dup = await Client.findByCedula(req.body.cedula.trim());
      if (dup) return badRequest(res, `Ya existe el cliente "${dup.name}" con esa cédula/RUC`);
    }
    created(res, await Client.create(req.body));
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const c = await Client.findById(req.params.id);
    if (!c) return notFound(res, 'Cliente no encontrado');
    if (req.body.cedula?.trim()) {
      const dup = await Client.findByCedula(req.body.cedula.trim(), +req.params.id);
      if (dup) return badRequest(res, `Ya existe el cliente "${dup.name}" con esa cédula/RUC`);
    }
    success(res, await Client.update(req.params.id, req.body));
  } catch (e) { next(e); }
};
exports.remove    = async (req, res, next) => { try { const ok = await Client.delete(req.params.id); ok ? success(res, null, 'Cliente desactivado') : notFound(res, 'Cliente no encontrado'); } catch (e) { next(e); } };

exports.getPdf = async (req, res, next) => {
  try {
    const [clients, settings] = await Promise.all([Client.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = clients.map(c => [
      c.name,
      c.cedula || '—',
      c.email || '—',
      c.phone || '—',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Clientes',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'CÉDULA/RUC', 'EMAIL', 'TELÉFONO'],
      widths:  [150, 90, 145, 110],
      aligns:  ['left', 'left', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="clientes.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
