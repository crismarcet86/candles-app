const { pool } = require('../config/database');

class Unit {
  static async findAll() {
    const [rows] = await pool.query('SELECT * FROM units ORDER BY name ASC');
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM units WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async create({ name, abbreviation }) {
    const [result] = await pool.query(
      'INSERT INTO units (name, abbreviation) VALUES (?, ?)',
      [name, abbreviation]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, abbreviation }) {
    await pool.query(
      'UPDATE units SET name = ?, abbreviation = ? WHERE id = ?',
      [name, abbreviation, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query('DELETE FROM units WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = Unit;
