import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/paddy/reports/summary/:field_id/:year/:crop_number - Get summary report
router.get('/summary/:field_id/:year/:crop_number', (req, res) => {
  try {
    const { field_id, year, crop_number } = req.params;

    // Get field info
    const field = db.prepare('SELECT * FROM paddy_fields WHERE id = ?').get(field_id);

    if (!field) {
      return res.status(404).json({ error: 'Field not found' });
    }

    // Get total expenses
    const expenseTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_expenses
      WHERE field_id = ? AND year = ? AND crop_number = ?
    `).get(field_id, year, crop_number);

    // Get expenses by category
    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM paddy_expenses
      WHERE field_id = ? AND year = ? AND crop_number = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(field_id, year, crop_number);

    // Get total income
    const incomeTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM paddy_income
      WHERE field_id = ? AND year = ? AND crop_number = ?
    `).get(field_id, year, crop_number);

    // Get income by category
    const incomeByCategory = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM paddy_income
      WHERE field_id = ? AND year = ? AND crop_number = ?
      GROUP BY category
    `).all(field_id, year, crop_number);

    // Get yield summary (for nel)
    const yieldSummary = db.prepare(`
      SELECT
        COALESCE(SUM(yield_kg), 0) as totalKg,
        COALESCE(SUM(kottai_count), 0) as totalKottai,
        COALESCE(AVG(rate_per_kottai), 0) as avgRate
      FROM paddy_income
      WHERE field_id = ? AND year = ? AND crop_number = ? AND category = 'nel'
    `).get(field_id, year, crop_number);

    const totalExpenses = expenseTotal.total;
    const totalIncome = incomeTotal.total;
    const profit = totalIncome - totalExpenses;

    res.json({
      field,
      year: parseInt(year),
      cropNumber: parseInt(crop_number),
      totalExpenses,
      totalIncome,
      profit,
      expensesByCategory,
      incomeByCategory,
      yieldSummary
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/paddy/reports/comparative - Compare field performance across years
router.get('/comparative', (req, res) => {
  try {
    const { field_id } = req.query;

    let query = `
      SELECT
        field_id,
        year,
        crop_number,
        (SELECT name FROM paddy_fields WHERE id = field_id) as field_name,
        (SELECT COALESCE(SUM(amount), 0) FROM paddy_expenses e WHERE e.field_id = pe.field_id AND e.year = pe.year AND e.crop_number = pe.crop_number) as total_expenses,
        (SELECT COALESCE(SUM(amount), 0) FROM paddy_income i WHERE i.field_id = pe.field_id AND i.year = pe.year AND i.crop_number = pe.crop_number) as total_income,
        (SELECT COALESCE(SUM(yield_kg), 0) FROM paddy_income i WHERE i.field_id = pe.field_id AND i.year = pe.year AND i.crop_number = pe.crop_number AND i.category = 'nel') as total_yield_kg
      FROM (
        SELECT DISTINCT field_id, year, crop_number FROM paddy_expenses
        UNION
        SELECT DISTINCT field_id, year, crop_number FROM paddy_income
      ) pe
    `;

    const params = [];

    if (field_id) {
      query += ' WHERE field_id = ?';
      params.push(field_id);
    }

    query += ' ORDER BY field_id, year DESC, crop_number';

    const data = db.prepare(query).all(...params);

    // Calculate profit for each entry
    const result = data.map(row => ({
      ...row,
      profit: row.total_income - row.total_expenses
    }));

    res.json(result);
  } catch (error) {
    console.error('Error generating comparative report:', error);
    res.status(500).json({ error: 'Failed to generate comparative report' });
  }
});

export default router;
