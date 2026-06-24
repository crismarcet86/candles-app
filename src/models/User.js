const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, is_active, created_at FROM users ORDER BY name ASC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, username, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByUsername(username) {
    // Incluye password para comparar en login
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ? AND is_active = 1',
      [username]
    );
    return rows[0] || null;
  }

  static async create({ name, username, password, role = 'user' }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, username, password, role) VALUES (?, ?, ?, ?)',
      [name, username, hash, role]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, username, role, is_active }) {
    await pool.query(
      'UPDATE users SET name = ?, username = ?, role = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, username, role, is_active, id]
    );
    return this.findById(id);
  }

  static async changePassword(id, newPassword) {
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query(
      'UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?',
      [hash, id]
    );
  }

  static async verifyPassword(plain, hash) {
    return bcrypt.compare(plain, hash);
  }

  static async delete(id) {
    const [result] = await pool.query(
      'UPDATE users SET is_active = 0 WHERE id = ?', [id]
    );
    return result.affectedRows > 0;
  }
}

module.exports = User;
