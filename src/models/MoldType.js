const { pool } = require('../config/database');

class MoldType {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT * FROM mold_types ORDER BY name'
    );
    return rows;
  }

  static async findAllActive() {
    const [rows] = await pool.query(
      'SELECT * FROM mold_types WHERE is_active = 1 ORDER BY name'
    );
    return rows;
  }

  static async findById(id) {
    const [[row]] = await pool.query('SELECT * FROM mold_types WHERE id = ?', [id]);
    return row || null;
  }

  static async create({ name }) {
    const [result] = await pool.query(
      'INSERT INTO mold_types (name) VALUES (?)',
      [name]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, is_active }) {
    await pool.query(
      'UPDATE mold_types SET name=?, is_active=?, updated_at=NOW() WHERE id=?',
      [name, is_active ?? 1, id]
    );
    return this.findById(id);
  }

  static async updateImage(id, image_path) {
    await pool.query(
      'UPDATE mold_types SET image_path=?, updated_at=NOW() WHERE id=?',
      [image_path, id]
    );
    return this.findById(id);
  }

  static async deactivate(id) {
    const [result] = await pool.query(
      'UPDATE mold_types SET is_active=0, updated_at=NOW() WHERE id=?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = MoldType;
