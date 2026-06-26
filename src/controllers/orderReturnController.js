const OrderReturn = require('../models/OrderReturn');
const { success, created, notFound, error } = require('../utils/response');

exports.getByOrder = async (req, res, next) => {
  try {
    const returns = await OrderReturn.findByOrderId(req.params.id);
    success(res, returns);
  } catch (e) { next(e); }
};

exports.create = async (req, res, next) => {
  try {
    const { notes, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return error(res, 'Se requiere al menos un ítem para devolver', 422);
    }
    for (const item of items) {
      if (!item.order_item_id || !(Number(item.quantity) > 0)) {
        return error(res, 'Cada ítem debe tener order_item_id y quantity > 0', 422);
      }
    }
    const returnId = await OrderReturn.create({ order_id: +req.params.id, notes, items });
    created(res, { id: returnId }, 'Devolución registrada correctamente');
  } catch (e) {
    if (e.message.includes('supera') || e.message.includes('no pertenece') || e.message.includes('no encontrada')) {
      return error(res, e.message, 422);
    }
    next(e);
  }
};
