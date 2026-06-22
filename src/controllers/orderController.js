const Order = require('../models/Order');
const { success, notFound } = require('../utils/response');

exports.getAll    = async (req, res, next) => { try { success(res, await Order.findAll()); } catch (e) { next(e); } };
exports.getById   = async (req, res, next) => { try { const o = await Order.findById(req.params.id); o ? success(res, o) : notFound(res, 'Orden no encontrada'); } catch (e) { next(e); } };
exports.updateStatus = async (req, res, next) => {
  try {
    const o = await Order.findById(req.params.id);
    if (!o) return notFound(res, 'Orden no encontrada');
    success(res, await Order.updateStatus(req.params.id, req.body.status), 'Estado actualizado');
  } catch (e) { next(e); }
};
