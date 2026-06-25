const { pool } = require('../config/database');

/**
 * Convierte gramos (valor del preset) a la unidad nativa del producto.
 * El stock siempre se guarda en la unidad del producto.
 * Ejemplos:
 *   kg : 177.66 g  → 177.66 / 1000 = 0.17766 kg
 *   lb : 100 g     → 100 / 453.592 = 0.2205 lb
 *   oz : 50 g      → 50 / 28.3495  = 1.764 oz
 *   g, ml, u: sin conversión
 */
function gramsToNativeUnit(grams, unitAbbr) {
  const unit = (unitAbbr || '').toLowerCase().trim();
  switch (unit) {
    case 'kg': return grams / 1000;
    case 'lb': return grams / 453.592;
    case 'oz': return grams / 28.3495;
    default:   return grams; // g, ml, u, l, etc.
  }
}

class Proforma {
  // ── Lectura ──────────────────────────────────────────────────

  static async findAll({ client = '', status = '', from = '', to = '' } = {}) {
    const conds = []; const params = [];
    if (client) { conds.push('c.name LIKE ?');          params.push(`%${client}%`); }
    if (status) { conds.push('p.status = ?');            params.push(status); }
    if (from)   { conds.push('DATE(p.created_at) >= ?'); params.push(from); }
    if (to)     { conds.push('DATE(p.created_at) <= ?'); params.push(to); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await pool.query(`
      SELECT p.*, c.name AS client_name
      FROM proformas p
      JOIN clients c ON p.client_id = c.id
      ${where}
      ORDER BY p.created_at DESC
    `, params);
    return rows;
  }

  static async findById(id) {
    const [proformas] = await pool.query(`
      SELECT p.*,
        c.name    AS client_name,
        c.cedula  AS client_cedula,
        c.phone   AS client_phone,
        c.address AS client_address
      FROM proformas p
      JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `, [id]);

    if (!proformas[0]) return null;

    const [items] = await pool.query(`
      SELECT
        pi.*,
        pr.name          AS product_name,
        u.abbreviation   AS unit_abbr,
        cp.name          AS preset_name
      FROM proforma_items pi
      LEFT JOIN products            pr ON pi.product_id = pr.id
      LEFT JOIN units               u  ON pr.unit_id    = u.id
      LEFT JOIN calculation_presets cp ON pi.preset_id  = cp.id
      WHERE pi.proforma_id = ?
      ORDER BY pi.id
    `, [id]);

    return { ...proformas[0], items };
  }

  // ── Creación / edición ───────────────────────────────────────

  /**
   * Crea o actualiza una proforma en borrador.
   * items: [{ product_id?, description, quantity, unit_price }]
   * - product_id es opcional (para ítems de texto libre / mano de obra)
   * - unit_price lo establece el usuario (no se toma del catálogo)
   */
  static async save({ id = null, client_id, notes, delivery_date = null, discount = 0, labor_cost = 0, items }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      let subtotal = 0;
      const enrichedItems = [];

      for (const item of items) {
        const lineSubtotal = Number(item.unit_price) * Number(item.quantity);
        subtotal += lineSubtotal;
        enrichedItems.push({
          product_id:  item.product_id  || null,
          preset_id:   item.preset_id   || null,
          description: item.description || null,
          quantity:    item.quantity,
          unit_price:  item.unit_price,
          subtotal:    lineSubtotal,
        });
      }

      const total = subtotal + Number(labor_cost) - Number(discount);

      let proformaId = id;

      const deliveryDateVal = delivery_date || null;

      if (id) {
        await conn.query(
          `UPDATE proformas
           SET client_id=?, notes=?, delivery_date=?, discount=?, labor_cost=?, subtotal=?, total=?, updated_at=NOW()
           WHERE id=? AND status='borrador'`,
          [client_id, notes || null, deliveryDateVal, discount, labor_cost, subtotal, total, id]
        );
        await conn.query('DELETE FROM proforma_items WHERE proforma_id = ?', [id]);
      } else {
        const [result] = await conn.query(
          'INSERT INTO proformas (client_id, notes, delivery_date, discount, labor_cost, subtotal, total) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [client_id, notes || null, deliveryDateVal, discount, labor_cost, subtotal, total]
        );
        proformaId = result.insertId;
      }

      for (const item of enrichedItems) {
        await conn.query(
          `INSERT INTO proforma_items
           (proforma_id, product_id, preset_id, description, quantity, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [proformaId, item.product_id, item.preset_id, item.description, item.quantity, item.unit_price, item.subtotal]
        );
      }

      await conn.commit();
      return this.findById(proformaId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  /**
   * Confirma la proforma:
   * 1. Marca como 'confirmada'
   * 2. Crea la orden
   * 3. Descuenta stock solo de ítems que referencian un ingrediente (product_id no nulo)
   */
  static async confirm(id) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const proforma = await this.findById(id);
      if (!proforma) throw new Error('Proforma no encontrada');
      if (proforma.status !== 'borrador') throw new Error('Solo se pueden confirmar proformas en borrador');

      const stockItems = proforma.items.filter(i => i.product_id);

      // Verificar stock suficiente para ítems directos con producto
      for (const item of stockItems) {
        const [[product]] = await conn.query(
          `SELECT p.stock, p.name, u.abbreviation AS unit_abbr
           FROM products p JOIN units u ON p.unit_id = u.id
           WHERE p.id = ? FOR UPDATE`,
          [item.product_id]
        );
        // item.quantity se guarda en gramos (o unidades); convertir a unidad nativa
        const required = gramsToNativeUnit(Number(item.quantity), product.unit_abbr);
        if (Number(product.stock) < required) {
          throw new Error(
            `Stock insuficiente para "${product.name}": ` +
            `disponible ${Number(product.stock).toFixed(4)} ${product.unit_abbr}, ` +
            `requerido ${required.toFixed(4)} ${product.unit_abbr}`
          );
        }
      }

      // Verificar stock para ítems de preset (ingredientes calculados)
      const presetItems = proforma.items.filter(i => i.preset_id);
      const presetIngredientDeltas = []; // { product_id, delta, name }
      for (const item of presetItems) {
        const [ingredients] = await conn.query(
          'SELECT * FROM calculation_preset_items WHERE preset_id = ? AND product_id IS NOT NULL',
          [item.preset_id]
        );
        for (const pi of ingredients) {
          // grams en el preset siempre son gramos reales; convertir a unidad nativa del producto
          const deltaPerUnit = gramsToNativeUnit(Number(pi.grams), pi.unit_abbr);
          const totalDelta = deltaPerUnit * Number(item.quantity);
          const [[product]] = await conn.query(
            'SELECT stock, name FROM products WHERE id = ? FOR UPDATE',
            [pi.product_id]
          );
          if (Number(product.stock) < totalDelta) {
            throw new Error(
              `Stock insuficiente para "${pi.ingredient_name}": ` +
              `disponible ${Number(product.stock).toFixed(4)} ${pi.unit_abbr}, ` +
              `requerido ${totalDelta.toFixed(4)} ${pi.unit_abbr} ` +
              `(${Number(pi.grams).toFixed(4)} g × ${item.quantity} und.)`
            );
          }
          presetIngredientDeltas.push({ product_id: pi.product_id, delta: totalDelta, name: pi.ingredient_name });
        }
      }

      // Marcar proforma como confirmada
      await conn.query(
        "UPDATE proformas SET status='confirmada', updated_at=NOW() WHERE id=?",
        [id]
      );

      // Crear orden
      const [orderResult] = await conn.query(
        `INSERT INTO orders (proforma_id, client_id, notes, delivery_date, subtotal, discount, total)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, proforma.client_id, proforma.notes, proforma.delivery_date || null, proforma.subtotal, proforma.discount, proforma.total]
      );
      const orderId = orderResult.insertId;

      // Copiar ítems y descontar stock directo
      for (const item of proforma.items) {
        const isService = !item.product_id && !item.preset_id ? 1 : 0;
        await conn.query(
          `INSERT INTO order_items (order_id, product_id, preset_id, description, quantity, unit_price, subtotal, is_service)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, item.product_id || null, item.preset_id || null, item.description, item.quantity, item.unit_price, item.subtotal, isService]
        );
        if (item.product_id) {
          // Convertir grams a unidad nativa antes de descontar
          const [[prod]] = await conn.query(
            'SELECT u.abbreviation AS unit_abbr FROM products p JOIN units u ON p.unit_id = u.id WHERE p.id = ?',
            [item.product_id]
          );
          const deduction = gramsToNativeUnit(Number(item.quantity), prod?.unit_abbr || 'g');
          await conn.query(
            'UPDATE products SET stock = stock - ?, updated_at=NOW() WHERE id=?',
            [deduction, item.product_id]
          );
        }
      }

      // Descontar stock de ingredientes de presets
      for (const { product_id, delta } of presetIngredientDeltas) {
        await conn.query(
          'UPDATE products SET stock = stock - ?, updated_at=NOW() WHERE id=?',
          [delta, product_id]
        );
      }

      // Anular presets usados (ya no están disponibles para nuevas proformas)
      const usedPresetIds = [...new Set(presetItems.map(i => i.preset_id))];
      for (const presetId of usedPresetIds) {
        await conn.query(
          'UPDATE calculation_presets SET is_active = 0 WHERE id = ?',
          [presetId]
        );
      }

      await conn.commit();

      const confirmed = await this.findById(id);
      return { proforma: confirmed, order_id: orderId };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async cancel(id) {
    const [result] = await pool.query(
      "UPDATE proformas SET status='cancelada', updated_at=NOW() WHERE id=? AND status='borrador'",
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Proforma;
