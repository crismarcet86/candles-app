const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { pool } = require('../config/database');
const { success, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll    = async (req, res, next) => { try { success(res, await Order.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const o = await Order.findById(req.params.id); o ? success(res, o) : notFound(res, 'Orden no encontrada'); } catch (e) { next(e); } };
exports.updateStatus = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return notFound(res, 'Orden no encontrada');
    success(res, await Order.updateStatus(req.params.id, req.body.status), 'Estado actualizado');
  } catch (e) { next(e); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const [[orders], settings] = await Promise.all([
      pool.query(`
        SELECT o.*, c.name AS client_name,
          (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
        FROM orders o
        JOIN clients c ON o.client_id = c.id
        ORDER BY o.created_at DESC
      `),
      Settings.get(),
    ]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = orders.map(o => [
      String(o.id).padStart(4, '0'),
      o.client_name,
      o.item_count || 0,
      `S/ ${(+o.total).toFixed(2)}`,
      o.status,
      new Date(o.created_at).toLocaleDateString('es-PE'),
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Pedidos',
      subtitle, businessName, logoPath,
      headers: ['ID', 'CLIENTE', 'ÍTEMS', 'TOTAL', 'ESTADO', 'FECHA'],
      widths:  [40, 175, 50, 80, 70, 80],
      aligns:  ['left', 'left', 'right', 'right', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
