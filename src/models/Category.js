const { pool } = require('../config/database');

class Category {
  static async findAll({ onlyActive = false } = {}) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const [rows] = await pool.query(
      `SELECT * FROM categories ${where} ORDER BY name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, description, is_fragrance }) {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, is_fragrance) VALUES (?, ?, ?)',
      [name, description || null, is_fragrance ? 1 : 0]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, description, is_active, is_fragrance }) {
    await pool.query(
      'UPDATE categories SET name = ?, description = ?, is_active = ?, is_fragrance = ?, updated_at = NOW() WHERE id = ?',
      [name, description ?? null, is_active ?? 1, is_fragrance ? 1 : 0, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    // Eliminación lógica: desactiva en lugar de borrar
    const [result] = await pool.query(
      'UPDATE categories SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Category;
