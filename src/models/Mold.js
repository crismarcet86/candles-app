const { pool } = require('../config/database');

class Mold {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM molds ORDER BY name'
    );
    return rows;
  }

  static async findAllActive() {
    const [rows] = await pool.query(
      'SELECT * FROM molds WHERE is_active = 1 ORDER BY name'
    );
    return rows;
  }

  static async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM molds WHERE id = ?', [id]);
    return row || null;
  }

  static async create({ name, wax_grams, description }) {
    const [result] = await pool.query(
      'INSERT INTO molds (name, wax_grams, description) VALUES (?, ?, ?)',
      [name, wax_grams, description || null]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, wax_grams, description, is_active }) {
    await pool.query(
      `UPDATE molds
       SET name=?, wax_grams=?, description=?, is_active=?, updated_at=NOW()
       WHERE id=?`,
      [name, wax_grams, description || null, is_active ?? 1, id]
    );
    return this.findById(id);
  }

  static async deactivate(id) {
    const [result] = await pool.query(
      'UPDATE molds SET is_active=0, updated_at=NOW() WHERE id=?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Mold;
