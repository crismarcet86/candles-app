const { pool } = require('../config/database');

class Mold {
  static async findAll({ name = '', mold_type_id = null } = {}) {
    const conds = []; const params = [];
    if (name)         { conds.push('(m.name LIKE ? OR m.description LIKE ?)'); params.push(`%${name}%`, `%${name}%`); }
    if (mold_type_id) { conds.push('m.mold_type_id = ?'); params.push(mold_type_id); }
    const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
    const [rows] = await pool.query(`
      SELECT m.*, mt.name AS mold_type_name
      FROM molds m
      LEFT JOIN mold_types mt ON m.mold_type_id = mt.id
      ${where}
      ORDER BY m.name
    `, params);
    return rows;
  }

  static async findAllActive() {
    const [rows] = await pool.query(`
      SELECT m.*, mt.name AS mold_type_name
      FROM molds m
      LEFT JOIN mold_types mt ON m.mold_type_id = mt.id
      WHERE m.is_active = 1
      ORDER BY m.name
    `);
    return rows;
  }

  static async findById(id) {
    const [[row]] = await pool.query(`
      SELECT m.*, mt.name AS mold_type_name
      FROM molds m
      LEFT JOIN mold_types mt ON m.mold_type_id = mt.id
      WHERE m.id = ?
    `, [id]);
    return row || null;
  }

  static async create({ name, wax_grams, total_grams, mold_type_id, description }) {
    const [result] = await pool.query(
      'INSERT INTO molds (name, wax_grams, total_grams, mold_type_id, description) VALUES (?, ?, ?, ?, ?)',
      [name, wax_grams, total_grams || null, mold_type_id || null, description || null]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, wax_grams, total_grams, mold_type_id, description, is_active }) {
    await pool.query(
      `UPDATE molds
       SET name=?, wax_grams=?, total_grams=?, mold_type_id=?, description=?, is_active=?, updated_at=NOW()
       WHERE id=?`,
      [name, wax_grams, total_grams || null, mold_type_id || null, description || null, is_active ?? 1, id]
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

  static async updateImage(id, image_path) {
    await pool.query(
      'UPDATE molds SET image_path=?, updated_at=NOW() WHERE id=?',
      [image_path, id]
    );
    return this.findById(id);
  }
}

module.exports = Mold;
