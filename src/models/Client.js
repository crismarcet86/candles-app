const { pool } = require('../config/database');

class Client {
  static async findAll({ onlyActive = false } = {}) {
    const where = onlyActive ? 'WHERE is_active = 1' : '';
    const [rows] = await pool.query(
      `SELECT * FROM clients ${where} ORDER BY name ASC`
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query('SELECT * FROM clients WHERE id = ?', [id]);
    return rows[0] || null;
  }

  /** Busca cliente activo con esa cédula/RUC. excludeId excluye al propio registro en edición. */
  static async findByCedula(cedula, excludeId = null) {
    const [rows] = await pool.query(
      `SELECT id, name FROM clients
       WHERE cedula = ? AND is_active = 1 ${excludeId ? 'AND id != ?' : ''} LIMIT 1`,
      excludeId ? [cedula, excludeId] : [cedula]
    );
    return rows[0] || null;
  }

  static async create({ name, cedula, email, phone, address, notes }) {
    const [result] = await pool.query(
      'INSERT INTO clients (name, cedula, email, phone, address, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [name, cedula || null, email || null, phone || null, address || null, notes || null]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, cedula, email, phone, address, notes, is_active }) {
    await pool.query(
      `UPDATE clients SET
        name = ?, cedula = ?, email = ?, phone = ?, address = ?, notes = ?, is_active = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [name, cedula ?? null, email ?? null, phone ?? null, address ?? null, notes ?? null, is_active ?? 1, id]
    );
    return this.findById(id);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'UPDATE clients SET is_active = 0 WHERE id = ?',
      [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = Client;
