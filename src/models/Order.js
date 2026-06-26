const { pool } = require('../config/database');

class Order {
  static async findAll({ client = '', status = '', delivery_status = '', from = '', to = '' } = {}) {
    const conds = []; const params = [];
    if (client)          { conds.push('c.name LIKE ?');              params.push(`%${client}%`); }
    if (status)          { conds.push('o.status = ?');               params.push(status); }
    if (delivery_status) { conds.push('o.delivery_status = ?');      params.push(delivery_status); }
    if (from)            { conds.push('DATE(o.created_at) >= ?');    params.push(from); }
    if (to)              { conds.push('DATE(o.created_at) <= ?');    params.push(to); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await pool.query(`
      SELECT o.*, c.name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      ${where}
      ORDER BY o.created_at DESC
    `, params);
    return rows;
  }

  static async findById(id) {
    const [orders] = await pool.query(`
      SELECT o.*, c.name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE o.id = ?
    `, [id]);

    if (!orders[0]) return null;

    const [items] = await pool.query(`
      SELECT
        oi.*,
        p.name         AS product_name,
        u.abbreviation AS unit_abbr,
        COALESCE((
          SELECT SUM(ri.quantity)
          FROM order_return_items ri
          JOIN order_returns r ON ri.return_id = r.id
          WHERE ri.order_item_id = oi.id AND r.order_id = oi.order_id
        ), 0) AS returned_quantity
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN units    u ON p.unit_id     = u.id
      WHERE oi.order_id = ?
      ORDER BY oi.id
    `, [id]);

    return { ...orders[0], items };
  }

  static async updateStatus(id, status) {
    await pool.query(
      'UPDATE orders SET status = ?, updated_at = NOW() WHERE id = ?',
      [status, id]
    );
    return this.findById(id);
  }

  static async updateDeliveryStatus(id, delivery_status) {
    await pool.query(
      'UPDATE orders SET delivery_status = ?, updated_at = NOW() WHERE id = ?',
      [delivery_status, id]
    );
    return this.findById(id);
  }
}

module.exports = Order;
