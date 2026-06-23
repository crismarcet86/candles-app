const Category = require('../models/Category');
const Settings = require('../models/Settings');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll    = async (req, res, next) => { try { success(res, await Category.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const c = await Category.findById(req.params.id); c ? success(res, c) : notFound(res, 'Categoría no encontrada'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Category.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const c = await Category.findById(req.params.id); if (!c) return notFound(res, 'Categoría no encontrada'); success(res, await Category.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Category.delete(req.params.id); ok ? success(res, null, 'Categoría desactivada') : notFound(res, 'Categoría no encontrada'); } catch (e) { next(e); } };

exports.getPdf = async (req, res, next) => {
  try {
    const [categories, settings] = await Promise.all([Category.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = categories.map(cat => [
      cat.name,
      cat.description || '—',
      cat.is_active === 1 ? 'Activa' : 'Inactiva',
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Categorías',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'DESCRIPCIÓN', 'ESTADO'],
      widths:  [200, 235, 60],
      aligns:  ['left', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="categorias.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
