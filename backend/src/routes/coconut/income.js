import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/income
router.get('/', (req, res) => {
  try {
    const { grove_id, year, category } = req.query;

    let query = 'SELECT * FROM coconut_income WHERE 1=1';
    const params = [];

    if (grove_id) {
      query += ' AND grove_id = ?';
      params.push(grove_id);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    if (category) {
      query += ' AND category = ?';
      params.push(category);
    }

    query += ' ORDER BY income_date DESC';

    const incomes = db.prepare(query).all(...params);
    res.json(incomes);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// GET /api/coconut/income/:id
router.get('/:id', (req, res) => {
  try {
    const income = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!income) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/coconut/income
router.post('/', (req, res) => {
  try {
    const { grove_id, year, category, quantity_kg, rate_per_kg, amount, income_date, notes } = req.body;

    if (!grove_id || !year || !category || !quantity_kg || !rate_per_kg || !amount || !income_date) {
      return res.status(400).json({ error: 'Grove, year, category, quantity, rate, amount, and date are required' });
    }

    const result = db.prepare(`
      INSERT INTO coconut_income (grove_id, year, category, quantity_kg, rate_per_kg, amount, income_date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(grove_id, year, category, quantity_kg, rate_per_kg, amount, income_date, notes);

    const newIncome = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    res.status(500).json({ error: 'Failed to create income' });
  }
});

// PUT /api/coconut/income/:id
router.put('/:id', (req, res) => {
  try {
    const { grove_id, year, category, quantity_kg, rate_per_kg, amount, income_date, notes } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.prepare(`
      UPDATE coconut_income
      SET grove_id = ?, year = ?, category = ?, quantity_kg = ?, rate_per_kg = ?, amount = ?, income_date = ?, notes = ?
      WHERE id = ?
    `).run(
      grove_id || existing.grove_id,
      year || existing.year,
      category || existing.category,
      quantity_kg || existing.quantity_kg,
      rate_per_kg || existing.rate_per_kg,
      amount || existing.amount,
      income_date || existing.income_date,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating income:', error);
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /api/coconut/income/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_income WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Income record not found' });
    }

    db.prepare('DELETE FROM coconut_income WHERE id = ?').run(req.params.id);
    res.json({ message: 'Income record deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;
