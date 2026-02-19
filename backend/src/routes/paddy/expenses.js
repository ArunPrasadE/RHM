import express from 'express';
import db from '../../config/db.js';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

// GET /api/paddy/expenses - List expenses with filters
router.get('/', (req, res) => {
  try {
    const { field_id, year, crop_number, category } = req.query;

    let query = 'SELECT * FROM paddy_expenses WHERE 1=1';
    const params = [];

    if (field_id) {
      query += ' AND field_id = ?';
      params.push(field_id);
    }

    if (year) {
      query += ' AND year = ?';
      params.push(year);
    }

    if (crop_number) {
      query += ' AND crop_number = ?';
      params.push(crop_number);
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

// GET /api/paddy/expenses/:id
router.get('/:id', (req, res) => {
  try {
    const expense = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/paddy/expenses
router.post('/', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      sequence_number,
      amount,
      expense_date,
      worker_id,
      notes
    } = req.body;

    if (!field_id || !year || !crop_number || !category || !amount || !expense_date) {
      return res.status(400).json({ error: 'Field, year, crop number, category, amount, and date are required' });
    }

    const result = db.prepare(`
      INSERT INTO paddy_expenses (field_id, year, crop_number, category, sequence_number, amount, expense_date, worker_id, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(field_id, year, crop_number, category, sequence_number, amount, expense_date, worker_id, notes);

    const newExpense = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newExpense);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/paddy/expenses/:id
router.put('/:id', (req, res) => {
  try {
    const {
      field_id,
      year,
      crop_number,
      category,
      sequence_number,
      amount,
      expense_date,
      worker_id,
      notes
    } = req.body;

    const existing = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare(`
      UPDATE paddy_expenses
      SET field_id = ?, year = ?, crop_number = ?, category = ?, sequence_number = ?, amount = ?, expense_date = ?, worker_id = ?, notes = ?
      WHERE id = ?
    `).run(
      field_id || existing.field_id,
      year || existing.year,
      crop_number || existing.crop_number,
      category || existing.category,
      sequence_number ?? existing.sequence_number,
      amount || existing.amount,
      expense_date || existing.expense_date,
      worker_id ?? existing.worker_id,
      notes ?? existing.notes,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/paddy/expenses/:id
router.delete('/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM paddy_expenses WHERE id = ?').get(req.params.id);

    if (!existing) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    db.prepare('DELETE FROM paddy_expenses WHERE id = ?').run(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
