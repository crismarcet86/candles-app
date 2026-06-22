const Product = require('../models/Product');
const { success, created, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll    = async (req, res, next) => { try { success(res, await Product.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const p = await Product.findById(req.params.id); p ? success(res, p) : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };
exports.create    = async (req, res, next) => { try { created(res, await Product.create(req.body)); } catch (e) { next(e); } };
exports.update    = async (req, res, next) => { try { const p = await Product.findById(req.params.id); if (!p) return notFound(res, 'Producto no encontrado'); success(res, await Product.update(req.params.id, req.body)); } catch (e) { next(e); } };
exports.remove    = async (req, res, next) => { try { const ok = await Product.delete(req.params.id); ok ? success(res, null, 'Producto desactivado') : notFound(res, 'Producto no encontrado'); } catch (e) { next(e); } };

exports.getPdf = async (req, res, next) => {
  try {
    const products = await Product.findAll();
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
      subtitle,
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
