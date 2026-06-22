const { pool } = require('../config/database');

class Settings {
  static async get() {
    const [rows] = await pool.query('SELECT * FROM business_settings WHERE id = 1');
    return rows[0] || null;
  }

  static async upsert({ name, ruc, phone, observations }) {
    await pool.query(`
      INSERT INTO business_settings (id, name, ruc, phone, observations)
      VALUES (1, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name         = VALUES(name),
        ruc          = VALUES(ruc),
        phone        = VALUES(phone),
        observations = VALUES(observations)
    `, [name, ruc || null, phone || null, observations || null]);
    return this.get();
  }

  static async updateLogo(logo_path) {
    await pool.query(`
      INSERT INTO business_settings (id, logo_path)
      VALUES (1, ?)
      ON DUPLICATE KEY UPDATE logo_path = VALUES(logo_path)
    `, [logo_path]);
    return this.get();
  }
}

module.exports = Settings;
