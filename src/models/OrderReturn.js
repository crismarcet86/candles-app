const { pool } = require('../config/database');

function gramsToNativeUnit(grams, unitAbbr) {
  const unit = (unitAbbr || '').toLowerCase().trim();
  switch (unit) {
    case 'kg': return grams / 1000;
    case 'lb': return grams / 453.592;
    case 'oz': return grams / 28.3495;
    default:   return grams;
  }
}

class OrderReturn {
  static async findByOrderId(orderId) {
    const [returns] = await pool.query(
      'SELECT * FROM order_returns WHERE order_id = ? ORDER BY created_at DESC',
      [orderId]
    );
    for (const ret of returns) {
      const [items] = await pool.query(
        'SELECT * FROM order_return_items WHERE return_id = ? ORDER BY id',
        [ret.id]
      );
      ret.items = items;
    }
    return returns;
  }

  /**
   * Registra una devolución (parcial o total).
   * items: [{ order_item_id, quantity, restores_stock }]
   *
   * Lógica de restauración de stock:
   *  - Ítem de servicio (is_service=1): no se puede devolver
   *  - Ítem directo (product_id): restaura quantity en la unidad nativa del producto
   *  - Ítem de calculadora (preset_id): restaura cada ingrediente del preset
   *    proporcionalmente según quantity devuelta (grams_por_unidad × quantity)
   *
   * Tras la devolución actualiza el status de la orden:
   *  - Todos los ítems retornables devueltos → 'anulado total'
   *  - Al menos uno con devolución parcial   → 'anulado parcial'
   */
  static async create({ order_id, notes, items }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [[order]] = await conn.query('SELECT id FROM orders WHERE id = ?', [order_id]);
      if (!order) throw new Error('Orden no encontrada');

      // ── 1. Validaciones ──────────────────────────────────────────
      for (const item of items) {
        const [[oi]] = await conn.query(
          'SELECT * FROM order_items WHERE id = ? AND order_id = ?',
          [item.order_item_id, order_id]
        );
        if (!oi) throw new Error(`Ítem #${item.order_item_id} no pertenece a esta orden`);
        if (oi.is_service) throw new Error(`"${oi.description || 'Ítem'}" es un servicio y no puede devolverse`);

        const [[{ already_returned }]] = await conn.query(
          `SELECT COALESCE(SUM(ri.quantity), 0) AS already_returned
           FROM order_return_items ri
           JOIN order_returns r ON ri.return_id = r.id
           WHERE ri.order_item_id = ? AND r.order_id = ?`,
          [item.order_item_id, order_id]
        );

        const available = Number(oi.quantity) - Number(already_returned);
        if (Number(item.quantity) > available + 0.0001) {
          throw new Error(
            `Cantidad a devolver (${item.quantity}) supera la disponible ` +
            `(${available.toFixed(4)}) para "${oi.description || 'ítem'}"`
          );
        }
      }

      // ── 2. Crear registro de devolución ──────────────────────────
      const [result] = await conn.query(
        'INSERT INTO order_returns (order_id, notes) VALUES (?, ?)',
        [order_id, notes || null]
      );
      const returnId = result.insertId;

      // ── 3. Insertar ítems y restaurar stock ──────────────────────
      for (const item of items) {
        const [[oi]] = await conn.query(
          `SELECT oi.*, p.name AS product_name, u.abbreviation AS unit_abbr
           FROM order_items oi
           LEFT JOIN products p ON oi.product_id = p.id
           LEFT JOIN units    u ON p.unit_id = u.id
           WHERE oi.id = ?`,
          [item.order_item_id]
        );

        const willRestore = item.restores_stock && (oi.product_id || oi.preset_id) ? 1 : 0;

        await conn.query(
          `INSERT INTO order_return_items
           (return_id, order_item_id, product_id, description, quantity, restores_stock)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [returnId, item.order_item_id, oi.product_id || null,
           oi.description || oi.product_name || null,
           item.quantity, willRestore]
        );

        if (item.restores_stock) {
          if (oi.product_id) {
            // Ítem directo: restaurar el producto directamente
            const delta = gramsToNativeUnit(Number(item.quantity), oi.unit_abbr || 'g');
            await conn.query(
              'UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?',
              [delta, oi.product_id]
            );
          } else if (oi.preset_id) {
            // Ítem de calculadora: restaurar cada ingrediente del preset
            // proporcionalmente: grams_por_unidad × cantidad_devuelta
            const [ingredients] = await conn.query(
              'SELECT * FROM calculation_preset_items WHERE preset_id = ? AND product_id IS NOT NULL',
              [oi.preset_id]
            );
            for (const pi of ingredients) {
              const deltaPerUnit = gramsToNativeUnit(Number(pi.grams), pi.unit_abbr);
              const total = deltaPerUnit * Number(item.quantity);
              await conn.query(
                'UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ?',
                [total, pi.product_id]
              );
            }
          }
        }
      }

      // ── 4. Actualizar status de la orden ─────────────────────────
      // Solo evalúa ítems retornables (is_service = 0)
      const [returnableItems] = await conn.query(
        `SELECT oi.quantity,
           COALESCE((
             SELECT SUM(ri.quantity)
             FROM order_return_items ri
             JOIN order_returns r ON ri.return_id = r.id
             WHERE ri.order_item_id = oi.id AND r.order_id = ?
           ), 0) AS returned_quantity
         FROM order_items oi
         WHERE oi.order_id = ? AND oi.is_service = 0`,
        [order_id, order_id]
      );

      if (returnableItems.length > 0) {
        const allFullyReturned = returnableItems.every(
          oi => Number(oi.returned_quantity) >= Number(oi.quantity) - 0.0001
        );
        const anyReturned = returnableItems.some(oi => Number(oi.returned_quantity) > 0);

        const newStatus = allFullyReturned ? 'anulado total' : anyReturned ? 'anulado parcial' : null;
        if (newStatus) {
          await conn.query('UPDATE orders SET status = ? WHERE id = ?', [newStatus, order_id]);
        }
      }

      await conn.commit();
      return returnId;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = OrderReturn;
