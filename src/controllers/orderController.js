const Order = require('../models/Order');
const Settings = require('../models/Settings');
const { pool } = require('../config/database');
const { success, notFound } = require('../utils/response');
const { generateListPDF } = require('../utils/pdfList');

exports.getAll = async (req, res, next) => {
  try {
    const { client = '', status = '', delivery_status = '', from = '', to = '' } = req.query;
    success(res, await Order.findAll({ client, status, delivery_status, from, to }));
  } catch (e) { next(e); }
};
exports.getById   = async (req, res, next) => { try { const o = await Order.findById(req.params.id); o ? success(res, o) : notFound(res, 'Orden no encontrada'); } catch (e) { next(e); } };
exports.updateStatus = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return notFound(res, 'Orden no encontrada');
    success(res, await Order.updateStatus(req.params.id, req.body.status), 'Estado actualizado');
  } catch (e) { next(e); }
};

exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return notFound(res, 'Orden no encontrada');
    const { delivery_status } = req.body;
    if (!['pendiente', 'entregado'].includes(delivery_status)) {
      const { error } = require('../utils/response');
      return error(res, 'Estado de entrega inválido', 422);
    }
    success(res, await Order.updateDeliveryStatus(req.params.id, delivery_status), 'Estado de entrega actualizado');
  } catch (e) { next(e); }
};

exports.getPdf = async (req, res, next) => {
  try {
    const { client = '', status = '', delivery_status = '', from = '', to = '' } = req.query;
    const filters = { client, status, delivery_status, from, to };
    const [orders, settings] = await Promise.all([
      Order.findAll(filters).then(async rows => {
        return Promise.all(rows.map(async o => {
          const [[cnt]] = await pool.query('SELECT COUNT(*) AS n FROM order_items WHERE order_id = ?', [o.id]);
          return { ...o, item_count: cnt.n };
        }));
      }),
      Settings.get(),
    ]);
    const businessName = settings?.name || 'Mi Negocio';
    const logoPath     = settings?.report_logo_path || settings?.logo_path || null;
    const subtitle = new Date().toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const rows = orders.map(o => [
      String(o.id).padStart(4, '0'),
      o.client_name,
      o.item_count || 0,
      `$${(+o.total).toFixed(2)}`,
      o.delivery_date
        ? new Date(o.delivery_date + 'T00:00:00').toLocaleDateString('es-PE')
        : '—',
      o.delivery_status === 'entregado' ? 'Entregado' : 'Pendiente',
      new Date(o.created_at).toLocaleDateString('es-PE'),
    ]);
    const pdf = await generateListPDF({
      title: 'Listado de Pedidos',
      subtitle, businessName, logoPath,
      headers: ['ID', 'CLIENTE', 'ÍTEMS', 'TOTAL', 'F. ENTREGA', 'ENTREGA', 'FECHA'],
      widths:  [35, 145, 40, 70, 70, 65, 70],
      aligns:  ['left', 'left', 'right', 'right', 'left', 'left', 'left'],
      rows,
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="pedidos.pdf"');
    res.send(pdf);
  } catch (e) { next(e); }
};
