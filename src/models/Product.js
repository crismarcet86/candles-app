const { pool } = require('../config/database');

class Product {
  static async findAll({ onlyActive = false } = {}) {
    const where = onlyActive ? 'WHERE p.is_active = 1' : '';
    const [rows] = await pool.query(`
      SELECT
        p.*,
        c.name         AS category_name,
        c.is_fragrance AS is_fragrance,
        u.name         AS unit_name,
        u.abbreviation AS unit_abbr
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN units      u ON p.unit_id     = u.id
      ${where}
      ORDER BY c.name, p.name
    `);
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(`
      SELECT
        p.*,
        c.name         AS category_name,
        c.is_fragrance AS is_fragrance,
        u.name         AS unit_name,
        u.abbreviation AS unit_abbr
      FROM products p
      JOIN categories c ON p.category_id = c.id
      JOIN units      u ON p.unit_id     = u.id
      WHERE p.id = ?
    `, [id]);
    return rows[0] || null;
  }

  static async create(data) {
    const { category_id, unit_id, name, description, price, stock, min_stock } = data;
    const [result] = await pool.query(
      `INSERT INTO products
        (category_id, unit_id, name, description, price, stock, min_stock)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [category_id, unit_id, name, description || null, price, stock || 0, min_stock || 0]
    );
    return this.findById(result.insertId);
  }

  static async update(id, data) {
    const { category_id, unit_id, name, description, price, stock, min_stock, is_active } = data;
    await pool.query(
      `UPDATE products SET
        category_id = ?, unit_id = ?, name = ?, description = ?,
        price = ?, stock = ?, min_stock = ?, is_active = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [category_id, unit_id, name, description ?? null, price, stock, min_stock, is_active ?? 1, id]
    );
    return this.findById(id);
  }

  static async adjustStock(id, delta, conn = null) {
    // delta positivo = entrada, negativo = salida
    const db = conn || pool;
    const [result] = await db.query(
      'UPDATE products SET stock = stock + ?, updated_at = NOW() WHERE id = ? AND stock + ? >= 0',
      [delta, id, delta]
    );
    if (result.affectedRows === 0) {
      throw new Error(`Stock insuficiente para el producto id=${id}`);
    }
    return this.findById(id);
  }

  static async setStock(id, newStock) {
    await pool.query(
      'UPDATE products SET stock = ?, updated_at = NOW() WHERE id = ?',
      [newStock, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'UPDATE products SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Product;
