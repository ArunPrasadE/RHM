import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/coconut/expenses
router.get('/', (req, res) => {
  try {
    const { grove_id, year, category } = req.query;

    let query = 'SELECT * FROM coconut_expenses WHERE 1=1';
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

    query += ' ORDER BY expense_date DESC';

    const expenses = db.prepare(query).all(...params);
    res.json(expenses);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/coconut/expenses/:id
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/coconut/expenses
router.post('/', (req, res) => {
  try {
    const { grove_id, year, category, amount, expense_date, worker_id, notes } = req.body;

    if (!grove_id || !year || !category || !amount || !expense_date) {
      return res.status(400).json({ error: 'Grove, year, category, amount, and date are required' });
    }

    const result = db.prepare(`
      INSERT INTO coconut_expenses (grove_id, year, category, amount, expense_date, worker_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(grove_id, year, category, amount, expense_date, worker_id, notes);

    const newExpense = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/coconut/expenses/:id
router.put('/:id', (req, res) => {
  try {
    const { grove_id, year, category, amount, expense_date, worker_id, notes } = req.body;

    const existing = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare(`
      UPDATE coconut_expenses
      SET grove_id = ?, year = ?, category = ?, amount = ?, expense_date = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `).run(
      grove_id || existing.grove_id,
      year || existing.year,
      category || existing.category,
      amount || existing.amount,
      expense_date || existing.expense_date,
      worker_id ?? existing.worker_id,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/coconut/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM coconut_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM coconut_expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
