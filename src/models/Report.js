const { pool } = require('../config/database');

class Report {
  static async getSummary() {
    const [[row]] = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM orders)                                                               AS total_orders,
        (SELECT COALESCE(SUM(total), 0) FROM orders)                                               AS total_revenue,
        (SELECT COUNT(*) FROM clients WHERE is_active = 1)                                         AS active_clients,
        (SELECT COUNT(*) FROM proformas WHERE status = 'borrador')                                 AS pending_proformas,
        (SELECT COUNT(*) FROM products WHERE is_active = 1 AND min_stock > 0 AND stock <= min_stock) AS low_stock_count
    `);
    return row;
  }

  static async getOrdersByPeriod({ from, to } = {}) {
    const fromDate = from || '2000-01-01';
    const toDate   = to   || '2099-12-31';
    const [rows] = await pool.query(`
      SELECT o.id, o.total, o.created_at, c.name AS client_name,
             (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS item_count
      FROM orders o
      JOIN clients c ON o.client_id = c.id
      WHERE DATE(o.created_at) BETWEEN ? AND ?
      ORDER BY o.created_at DESC
    `, [fromDate, toDate]);
    return rows;
  }

  static async getLowStock() {
    const [rows] = await pool.query(`
      SELECT p.id, p.name, p.stock, p.min_stock, p.price,
             cat.name AS category_name, u.abbreviation AS unit_abbr
      FROM products p
      LEFT JOIN categories cat ON p.category_id = cat.id
      LEFT JOIN units u ON p.unit_id = u.id
      WHERE p.is_active = 1 AND p.min_stock > 0 AND p.stock <= p.min_stock
      ORDER BY (p.stock / p.min_stock) ASC
    `);
    return rows;
  }

  static async getTopClients(limit = 10) {
    const [rows] = await pool.query(`
      SELECT c.id, c.name, COUNT(o.id) AS order_count,
             COALESCE(SUM(o.total), 0) AS total_spent
      FROM clients c
      INNER JOIN orders o ON o.client_id = c.id
      WHERE c.is_active = 1
      GROUP BY c.id, c.name
      ORDER BY total_spent DESC
      LIMIT ?
    `, [limit]);
    return rows;
  }
}

module.exports = Report;
