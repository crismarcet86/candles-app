const Product = require('../models/Product');
const Settings = require('../models/Settings');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll    = async (req, res, next) => { try { success(res, await Product.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const p = await Product.findById(req.params.id); p ? success(res, p) : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Product.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const p = await Product.findById(req.params.id); if (!p) return notFound(res, 'Producto no encontrado'); success(res, await Product.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Product.delete(req.params.id); ok ? success(res, null, 'Producto desactivado') : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };

exports.addStock = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const p = await Product.findById(req.params.id);
    if (!p) return notFound(res, 'Producto no encontrado');
    const updated = await Product.adjustStock(req.params.id, +quantity);
    success(res, updated, 'Stock actualizado');
  } catch (e) { next(e); }
};

exports.getStockPdf = async (req, res, next) => {
  try {
    const [products, settings] = await Promise.all([Product.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = products.map(p => {
      const low = Number(p.min_stock) > 0 && Number(p.stock) <= Number(p.min_stock);
      return [
        p.name,
        p.category_name || '—',
        p.unit_abbr || '—',
        p.stock,
        p.min_stock || '—',
        low ? 'Stock bajo' : 'OK',
      ];
    });
    const pdf = await generateListPDF({
      title: 'Reporte de Stock',
      subtitle, businessName, logoPath,
      headers: ['INGREDIENTE', 'CATEGORÍA', 'UNIDAD', 'STOCK ACTUAL', 'MÍN.', 'ESTADO'],
      widths:  [155, 110, 55, 75, 55, 70],
      aligns:  ['left', 'left', 'left', 'right', 'right', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="stock.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const [products, settings] = await Promise.all([Product.findAll(), Settings.get()]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = products.map(p => [
      p.name,
      p.category_name || '—',
      p.unit_abbr || '—',
      `S/ ${(+p.price).toFixed(2)}`,
      p.stock,
      p.min_stock,
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Ingredientes',
      subtitle, businessName, logoPath,
      headers: ['NOMBRE', 'CATEGORÍA', 'UNIDAD', 'PRECIO', 'STOCK', 'MÍN.'],
      widths:  [160, 110, 55, 65, 55, 50],
      aligns:  ['left', 'left', 'left', 'right', 'right', 'right'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="ingredientes.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
