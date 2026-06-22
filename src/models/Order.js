const { pool } = require('../config/database');

class Order {
  static async findAll() {
    const [rows] = await pool.query(`
      SELECT o.*, c.name AS client_name
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      ORDER BY o.created_at DESC
    `);
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
        u.abbreviation AS unit_abbr
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN units    u ON p.unit_id     = u.id
      WHERE oi.order_id = ?
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
}

module.exports = Order;
