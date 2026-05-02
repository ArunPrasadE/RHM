import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/reports/summary/:grove_id/:year
router.get('/summary/:grove_id/:year', (req, res) => {
  try {
    const { grove_id, year } = req.params;

    // Get grove info
    const grove = db.prepare('SELECT * FROM coconut_groves WHERE id = ?').get(grove_id);

    if (!grove) {
      return res.status(404).json({ error: 'Grove not found' });
    }

    // Get total expenses
    const expenseTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_expenses
      WHERE grove_id = ? AND year = ?
    `).get(grove_id, year);

    // Get expenses by category
    const expensesByCategory = db.prepare(`
      SELECT category, SUM(amount) as total
      FROM coconut_expenses
      WHERE grove_id = ? AND year = ?
      GROUP BY category
      ORDER BY total DESC
    `).all(grove_id, year);

    // Get total income
    const incomeTotal = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM coconut_income
      WHERE grove_id = ? AND year = ?
    `).get(grove_id, year);

    // Get income by category
    const incomeByCategory = db.prepare(`
      SELECT category, SUM(amount) as total, SUM(quantity_kg) as total_kg
      FROM coconut_income
      WHERE grove_id = ? AND year = ?
      GROUP BY category
    `).all(grove_id, year);

    // Get yield summary
    const yieldSummary = db.prepare(`
      SELECT
        category,
        COALESCE(SUM(quantity_kg), 0) as totalKg,
        COALESCE(AVG(rate_per_kg), 0) as avgRate
      FROM coconut_income
      WHERE grove_id = ? AND year = ?
      GROUP BY category
    `).all(grove_id, year);

    const totalExpenses = expenseTotal.total;
    const totalIncome = incomeTotal.total;
    const profit = totalIncome - totalExpenses;

    res.json({
      grove,
      year: parseInt(year),
      expenses: {
        total: totalExpenses,
        byCategory: expensesByCategory
      },
      income: {
        total: totalIncome,
        byCategory: incomeByCategory
      },
      profit,
      yieldSummary
    });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

// GET /api/coconut/reports/comparative
router.get('/comparative', (req, res) => {
  try {
    const { grove_id } = req.query;

    let query = `
      SELECT
        grove_id,
        year,
        (SELECT name FROM coconut_groves WHERE id = grove_id) as grove_name,
        (SELECT COALESCE(SUM(amount), 0) FROM coconut_expenses e WHERE e.grove_id = ce.grove_id AND e.year = ce.year) as total_expenses,
        (SELECT COALESCE(SUM(amount), 0) FROM coconut_income i WHERE i.grove_id = ce.grove_id AND i.year = ce.year) as total_income,
        (SELECT COALESCE(SUM(quantity_kg), 0) FROM coconut_income i WHERE i.grove_id = ce.grove_id AND i.year = ce.year AND i.category = 'thengai') as thengai_kg,
        (SELECT COALESCE(SUM(quantity_kg), 0) FROM coconut_income i WHERE i.grove_id = ce.grove_id AND i.year = ce.year AND i.category = 'mangai') as mangai_kg
      FROM (
        SELECT DISTINCT grove_id, year FROM coconut_expenses
        UNION
        SELECT DISTINCT grove_id, year FROM coconut_income
      ) ce
    `;

    const params = [];

    if (grove_id) {
      query += ' WHERE grove_id = ?';
      params.push(grove_id);
    }

    query += ' ORDER BY grove_id, year DESC';

    const data = db.prepare(query).all(...params);

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
