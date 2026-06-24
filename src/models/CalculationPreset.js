const { pool } = require('../config/database');

class CalculationPreset {
  static async findAll({ includeInactive = false } = {}) {
    const where = includeInactive ? '' : 'WHERE cp.is_active = 1';
    const [rows] = await pool.query(`
      SELECT cp.*,
        (SELECT COUNT(*) FROM calculation_preset_items cpi WHERE cpi.preset_id = cp.id) AS item_count
      FROM calculation_presets cp
      ${where}
      ORDER BY cp.created_at DESC
    `);
    return rows;
  }

  static async findByName(name, excludeId = null) {
    const sql = excludeId
      ? 'SELECT id FROM calculation_presets WHERE name = ? AND id != ? AND is_active = 1 LIMIT 1'
      : 'SELECT id FROM calculation_presets WHERE name = ? AND is_active = 1 LIMIT 1';
    const params = excludeId ? [name, excludeId] : [name];
    const [rows] = await pool.query(sql, params);
    return rows[0] || null;
  }

  static async findById(id) {
    const [[preset]] = await pool.query(
      'SELECT * FROM calculation_presets WHERE id = ?', [id]
    );
    if (!preset) return null;
    const [items] = await pool.query(
      'SELECT * FROM calculation_preset_items WHERE preset_id = ? ORDER BY id', [id]
    );
    return { ...preset, items };
  }

  /**
   * Guarda un cálculo como preset reutilizable.
   * items: [{ product_id, ingredient_name, grams, is_unit, unit_abbr, unit_cost, subtotal, fragrance_pct }]
   */
  static async create({ name, mold_name, wax_grams, quantity, sell_price, cost_per_unit, includes_color, items }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO calculation_presets
          (name, mold_name, wax_grams, quantity, sell_price, cost_per_unit, includes_color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, mold_name || null, wax_grams || null, quantity || 1, sell_price || 0, cost_per_unit || 0, includes_color ? 1 : 0]
      );
      const presetId = result.insertId;

      for (const item of items) {
        if (!item.ingredient_id && !item.ingredient_name) continue;
        await conn.query(
          `INSERT INTO calculation_preset_items
            (preset_id, product_id, ingredient_name, grams, is_unit, unit_abbr, unit_cost, subtotal, fragrance_pct)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            presetId,
            item.ingredient_id || null,
            item.ingredient_name || '',
            item.grams || 0,
            item.is_unit ? 1 : 0,
            item.unit_abbr || '',
            item.unit_cost || 0,
            item.subtotal || 0,
            item.fragrance_pct != null ? item.fragrance_pct : null,
          ]
        );
      }

      await conn.commit();
      return this.findById(presetId);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async update(id, { name, mold_name, wax_grams, quantity, sell_price, cost_per_unit, includes_color, items }) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      await conn.query(
        `UPDATE calculation_presets
         SET name=?, mold_name=?, wax_grams=?, quantity=?, sell_price=?, cost_per_unit=?, includes_color=?, is_active=1, updated_at=NOW()
         WHERE id=?`,
        [name, mold_name || null, wax_grams || null, quantity || 1, sell_price || 0, cost_per_unit || 0, includes_color ? 1 : 0, id]
      );

      await conn.query('DELETE FROM calculation_preset_items WHERE preset_id = ?', [id]);

      for (const item of items) {
        if (!item.ingredient_id && !item.ingredient_name) continue;
        await conn.query(
          `INSERT INTO calculation_preset_items
            (preset_id, product_id, ingredient_name, grams, is_unit, unit_abbr, unit_cost, subtotal, fragrance_pct)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id,
            item.ingredient_id || null,
            item.ingredient_name || '',
            item.grams || 0,
            item.is_unit ? 1 : 0,
            item.unit_abbr || '',
            item.unit_cost || 0,
            item.subtotal || 0,
            item.fragrance_pct != null ? item.fragrance_pct : null,
          ]
        );
      }

      await conn.commit();
      return this.findById(id);
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  static async delete(id) {
    const [r] = await pool.query(
      'UPDATE calculation_presets SET is_active = 0 WHERE id = ?', [id]
    );
    return r.affectedRows > 0;
  }
}

module.exports = CalculationPreset;
