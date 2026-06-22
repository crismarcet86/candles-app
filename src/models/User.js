const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async findAll() {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name ASC'
    );
    return rows;
  }

  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  }

  static async findByEmail(email) {
    // Incluye password para comparar en login
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email]
    );
    return rows[0] || null;
  }

  static async create({ name, email, password, role = 'user' }) {
    const hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hash, role]
    );
    return this.findById(result.insertId);
  }

  static async update(id, { name, email, role, is_active }) {
    await pool.query(
      'UPDATE users SET name = ?, email = ?, role = ?, is_active = ?, updated_at = NOW() WHERE id = ?',
      [name, email, role, is_active, id]
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
